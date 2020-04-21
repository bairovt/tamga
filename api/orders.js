"use strict";
const db = require("../lib/arangodb");
const aql = require("arangojs").aql;
const Router = require("koa-router");
const authorize = require("../middleware/authorize");

const router = new Router();

async function findOrders(ctx) {
  let {
    search = "", client_key = "", status = ""
  } = ctx.query;
  let orders = await db
    .query(
      aql `FOR order IN Orders
          LET client = DOCUMENT(order.client_id)
          FILTER ${!!status} ? order.status == ${status} : true
          FILTER ${!!client_key} ? order.client_id == Clients/${client_key} : true
          FILTER ${!!search} ? REGEX_TEST(order.info, ${search}, true) : true
          SORT order.createdAt DESC          
          RETURN MERGE(order, {client: client})`)
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    orders,
  };
}

async function getOrder(ctx) {
  const {
    _key
  } = ctx.params;
  let order = await db
    .query(
      aql `FOR order IN Orders
          FILTER order._key == ${_key}          
          RETURN MERGE(order, {client: DOCUMENT(order.client_id)})`)
    .then((cursor) => {
      return cursor.next();
    });
  if (!order) ctx.throw(404);
  ctx.body = {
    order,
  };
}

async function createOrder(ctx) {
  const {
    createOrderDto
  } = ctx.request.body;
  // let orderData = Joi.attempt(createOrderDto, orderSchema); // todo: validation
  let orderData = createOrderDto;
  orderData.status = "NEW";
  orderData.createdBy = ctx.state.user._id;
  orderData.createdAt = new Date();
  const ordersCollection = db.collection("Orders");
  const order = await ordersCollection.save(orderData);
  ctx.body = {
    order_key: order._key,
  };
}

async function updateOrder(ctx) {
  const {
    _key
  } = ctx.params;
  const {
    user
  } = ctx.state;
  const ordersCollection = db.collection("Orders");
  const order = ordersCollection.document(_key);
  if (!order) ctx.throw(404);
  let {
    updateOrderDto
  } = ctx.request.body;
  // let orderData = Joi.attempt(updateOrderDto, orderSchema.unknown()); // {stripUnknown: true}
  orderData.updatedBy = user._id;
  orderData.updatedAt = new Date();
  await ordersCollection.update(_key, orderData);
  ctx.body = {
    result: "OK",
  };
}

async function deleteOrder(ctx) {
  const {
    _key
  } = ctx.params;
  const ordersCollection = db.collection("Orders");
  const order = await ordersCollection.document(_key);
  if (!order) ctx.throw(404);
  let productsCount = await db
    .query(
      aql `FOR product IN Products          
          FILTER product.order_id == Orders/${_key}
          COLLECT WITH COUNT INTO cnt
          RETURN cnt`)
    .then((cursor) => {
      return cursor.next();
    });
  if (productsCount) ctx.throw(400, "Order has products");

  await ordersCollection.remove(_key);
  ctx.body = {
    result: "OK",
  };
}

router
  .post("/", authorize(["palam", "vova"]), createOrder)
  .get("/", findOrders)
  .get("/:_key", getOrder)
  .patch("/:_key", authorize(["palam", "vova"]), updateOrder)
  .delete("/:_key", authorize(["palam", "vova"]), deleteOrder);

module.exports = router.routes();