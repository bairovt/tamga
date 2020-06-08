const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const Product = require('../models/Product');

const router = new Router();

async function takeOnSklad(ctx) {
  const { client_id, order_id, sklad_id } = ctx.request.body;
  const ordersColl = db.collection('Order');
  const order = await ordersColl.document(order_id);
  if (order.status !== 'NEW') ctx.throw(400, 'Order status should be NEW');
  const products = await Product.getByOrderId(order_id);

  const shifts = [];
  const createdBy = ctx.state.user._id;
  const createdAt = new Date();
  for (let product of products) {
    let shift = {
      _from: client_id,
      _to: sklad_id,
      order_id: order_id,
      product_id: product._id,
      qty: product.qty,
      seats: product.seats,
      createdBy,
      createdAt,
    };
    shifts.push(shift);
  }
  const shiftColl = db.collection('Shift');
  await shiftColl.import(shifts, { complete: true });
  const status = 'TAKEN';
  await ordersColl.update(order_id, { status });
  ctx.body = {
    result: 'ok',
    status,
  };
}

async function shiftTo(ctx) {
  const { from_id, to_id, products } = ctx.request.body;

  const shifts = [];
  const createdBy = ctx.state.user._id;
  const createdAt = new Date();
  for (const product of products) {
    const shift = {
      _from: from_id,
      _to: to_id,
      product_id: product.product_id,
      qty: product.qty,
      seats: product.seats,
      createdBy,
      createdAt,
    };
    shifts.push(shift);
  }
  const shiftColl = db.collection('Shift');
  await shiftColl.import(shifts, { complete: true });

  ctx.body = {
    result: 'ok',
  };
}

router.post('/take-on-sklad', takeOnSklad).post('/shift-to', shiftTo);

module.exports = router.routes();
