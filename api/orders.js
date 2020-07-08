'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const orderSchema = require('../schemas/orderSchema');
const orderSrv = require('../services/order');

const router = new Router();

async function findOrders(ctx) {
  let { search = '', client_key = '', status = '', with_client = '' } = ctx.query;

  let orders = await db
    .query(
      aql`FOR order IN Order
          LET client = ${!!with_client} ? DOCUMENT(order.client_id) : null
          FILTER ${!!status} ? order.status == ${status} : true
          FILTER ${!!client_key} ? order.client_id == ${'Client/' + client_key} : true
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
  const { order_key } = ctx.params;
  const order_id = 'Order/' + order_key;

  const order = await orderSrv.getOr404(order_id);
  const products = await orderSrv.getProducts(order_id);

  ctx.body = {
    order,
    products,
  };
}

async function createOrder(ctx) {
  const { createOrderDto } = ctx.request.body;
  let orderData = Joi.attempt(createOrderDto, orderSchema, { stripUnknown: true });
  orderData.status = 'NEW';
  orderData.createdBy = ctx.state.user._id;
  orderData.createdAt = new Date();
  const order = await db.collection('Order').save(orderData);
  ctx.body = {
    order_key: order._key,
  };
}

async function updateOrder(ctx) {
  const { order_key } = ctx.params;
  const { user } = ctx.state;
  let { updateOrderDto } = ctx.request.body;
  let orderData = Joi.attempt(updateOrderDto, orderSchema, { stripUnknown: true });
  orderData.updatedBy = user._id;
  orderData.updatedAt = new Date();
  await db.collection('Order').update(order_key, orderData);
  ctx.body = {
    result: 'OK',
  };
}

async function deleteOrder(ctx) {
  const { order_key } = ctx.params;
  const order_id = 'Order/' + order_key;
  const ordersColl = db.collection('Order');

  const order = await ordersColl.document(order_id);
  if (!order) ctx.throw(404);

  const productsCount = await orderSrv.productsCount(order_id);
  if (productsCount) ctx.throw(400, 'Удалеяемый заказ не должен содержать товаров');

  await ordersColl.remove(order_id);
  ctx.body = {
    result: 'OK',
  };
}

router
  .post('/', authorize(['logist']), createOrder)
  .get('/', findOrders)
  .get('/:order_key', getOrder)
  .put('/:order_key', authorize(['logist']), updateOrder)
  .delete('/:order_key', authorize(['logist']), deleteOrder);

module.exports = router.routes();
