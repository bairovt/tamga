const Nomen = require('../models/Nomen');
const Product = require('../models/Product');
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const { func } = require('@hapi/joi');
const customError = require('../lib/custom-error');

async function getOr404(order_id) {
  let order = await db
    .query(
      aql`FOR order IN Order
          FILTER order._id == ${order_id}
          RETURN MERGE(order, {
            client: DOCUMENT(order.client_id),
            takenOnSklad: DOCUMENT(order.takenOn)
          })`
    )
    .then((cursor) => {
      return cursor.next();
    });
  if (!order) throw new customError(404, 'Заказ не найден');
  return order;
}

async function getProducts(order_id) {
  let products = await db
    .query(
      aql`FOR product IN Product
          LET nomen = DOCUMENT(product.nomen_id)
          LET taken = TO_BOOL(FIRST(FOR s IN Shift 
            FILTER s.product_id == product._id RETURN s))
          FILTER product.order_id == ${order_id}
          SORT product.createdAt DESC
          RETURN MERGE(product, {
            tnved: nomen.tnved, name: nomen.name, measure: nomen.measure, taken: taken
          })`
    )
    .then((cursor) => {
      return cursor.all();
    });
  return products;
}

async function productsCount(order_id) {
  const count = await db
    .query(
      aql`FOR product IN Product          
          FILTER product.order_id == ${order_id}
          COLLECT WITH COUNT INTO cnt
          RETURN cnt`
    )
    .then((cursor) => {
      return cursor.next();
    });

  return count;
}

async function checkIsNew(_id) {
  let count = await db
    .query(
      aql`FOR p IN Product
          FILTER p.order_id == ${_id}
          COLLECT WITH COUNT INTO cnt
          RETURN cnt`
    )
    .then((cursor) => cursor.next());

  if (count === 0) {
    await db.collection('Order').update(_id, { status: 'NEW', takenOn: null });
  }
}

async function getNotTakenProducts(order_id) {
  let products = await db
    .query(
      aql`FOR p IN Product          
          FILTER p.order_id == ${order_id}
          FILTER TO_BOOL(p.seats) AND TO_BOOL(p.qty)
          FILTER NOT TO_BOOL(FIRST(
              FOR s IN Shift 
              FILTER s.product_id == p._id 
              RETURN s))
          RETURN p`
    )
    .then((cursor) => cursor.all());
  return products;
}

module.exports = { getOr404, getProducts, productsCount, checkIsNew, getNotTakenProducts };
