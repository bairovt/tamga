const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const Product = require('../models/Product');
const orderSrv = require('../services/order-service');

const router = new Router();

async function takeOnSklad(ctx) {
  const { client_id, order_id, sklad_id } = ctx.request.body;
  const ordersColl = db.collection('Order');
  const order = await ordersColl.document(order_id);
  if (!['NEW', 'TAKEN'].includes(order.status)) {
    ctx.throw(400, 'Для приняния на склад статус заказа должен быть НОВЫЙ или ПРИНЯТ');
  }
  if (order.status === 'TAKEN') {
    if (order.takenOn !== sklad_id) {
      ctx.throw(400, 'Нельзя принимать товары одного заказа на разные склады');
    }
  }
  const products = await orderSrv.getNotTakenProducts(order_id);
  if (products.length === 0) ctx.throw(400, 'Нет товарных позиций для принятия');

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

  if (order.status === 'NEW') {
    await ordersColl.update(order_id, {
      status: 'TAKEN',
      takenOn: sklad_id,
    });
  }

  ctx.body = {
    result: 'ok',
    status: 'TAKEN',
    takenCount: products.length,
  };
}

async function shiftTo(ctx) {
  //todo: verify shifting completely
  //todo: validate data; shift schema
  const { from_id, to_id, products } = ctx.request.body;
  const shifts = [];
  const createdBy = ctx.state.user._id;
  const createdAt = new Date();
  for (const product of products) {
    const shift = {
      _from: from_id,
      _to: to_id,
      product_id: product.product_id,
      qty: +product.qty,
      seats: +product.seats,
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
