const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const Product = require('../models/Product');

const router = new Router();

async function takeOnRepo(ctx) {
  const { client_id, order_id, repo_id } = ctx.request.body;
  const ordersColl = db.collection('Orders');
  const order = await ordersColl.document(order_id);
  if (order.status !== 'NEW') ctx.throw(400, 'Order status should be NEW');
  const products = await Product.getByOrderId(order_id);

  const shifts = [];
  const createdAt = new Date();
  for (let product of products) {
    let shift = {
      _from: client_id,
      _to: repo_id,
      order_id: order_id,
      product_id: product._id,
      qty: product.qty,
      seats: product.seats,
      createdBy: ctx.state.user._id,
      createdAt,
    };
    shifts.push(shift);
  }
  const shiftsColl = db.collection('shifts');
  await shiftsColl.import(shifts, { complete: true });
  const status = 'TAKEN';
  await ordersColl.update(order_id, { status });
  ctx.body = {
    result: 'ok',
    status,
  };
}

router.post('/take-on-repo', takeOnRepo);

module.exports = router.routes();
