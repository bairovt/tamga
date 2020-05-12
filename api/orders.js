'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const orderSchema = require('../models/schemas/orderSchema');

const router = new Router();

async function findOrders(ctx) {
  let { search = '', client_key = '', status = '', with_client = '' } = ctx.query;

  let orders = await db
    .query(
      aql`FOR order IN Orders
          LET client = ${!!with_client} ? DOCUMENT(order.client_id) : null
          FILTER ${!!status} ? order.status == ${status} : true
          FILTER ${!!client_key} ? order.client_id == ${'Clients/' + client_key} : true
          FILTER ${!!search} ? REGEX_TEST(order.info, ${search}, true) : true
          SORT order.createdAt DESC          
          RETURN MERGE(order, {client: client})`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    orders,
  };
}

async function getOrder(ctx) {
  const { _key } = ctx.params;
  // todo: const { with_products = true } = ctx.query;
  let order = await db
    .query(
      aql`FOR order IN Orders
          FILTER order._key == ${_key}          
          RETURN MERGE(order, {client: DOCUMENT(order.client_id)})`
    )
    .then((cursor) => {
      return cursor.next();
    });
  if (!order) ctx.throw(404, 'Order not found');

  let products = await db
    .query(
      aql`FOR product IN Products
          FILTER product.order_id == ${'Orders/' + _key}
          SORT product.createdAt DESC
          RETURN product`
    )
    .then((cursor) => {
      return cursor.all();
    });

  ctx.body = {
    order,
    products,
  };
}

async function createOrder(ctx) {
  const { createOrderDto } = ctx.request.body;
  orderData.status = 'NEW';
  let orderData = Joi.attempt(createOrderDto, orderSchema, { stripUnknown: true });
  orderData.createdBy = ctx.state.user._id;
  orderData.createdAt = new Date();
  const order = await db.collection('Orders').save(orderData);
  ctx.body = {
    order_key: order._key,
  };
}

async function updateOrder(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  let { updateOrderDto } = ctx.request.body;
  let orderData = Joi.attempt(updateOrderDto, orderSchema, { stripUnknown: true });
  orderData.updatedBy = user._id;
  orderData.updatedAt = new Date();
  await db.collection('Orders').update(_key, orderData);
  ctx.body = {
    result: 'OK',
  };
}

async function deleteOrder(ctx) {
  const { _key } = ctx.params;
  const ordersColl = db.collection('Orders');
  const order = await ordersColl.document(_key);
  if (!order) ctx.throw(404);
  let productsCount = await db
    .query(
      aql`FOR product IN Products          
          FILTER product.order_id == ${'Orders/' + _key}
          COLLECT WITH COUNT INTO cnt
          RETURN cnt`
    )
    .then((cursor) => {
      return cursor.next();
    });
  if (productsCount) ctx.throw(400, 'Order has products');

  await ordersColl.remove(_key);
  ctx.body = {
    result: 'OK',
  };
}

router
  .post('/', authorize(['palam', 'vova']), createOrder)
  .get('/', findOrders)
  .get('/:_key', getOrder)
  .put('/:_key', authorize(['palam', 'vova']), updateOrder)
  .delete('/:_key', authorize(['palam', 'vova']), deleteOrder);

module.exports = router.routes();
