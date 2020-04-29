"use strict";
const db = require("../lib/arangodb");
const aql = require("arangojs").aql;
const Router = require("koa-router");
const authorize = require("../middleware/authorize");
const Joi = require('joi');
const {
  updateProductSchema
} = require('../models/schemas/productSchemas');

const router = new Router();

async function findProducts(ctx) {
  let {
    search = "", order_key = ""
  } = ctx.query;
  let products = await db
    .query(
      aql `FOR product IN Products
          LET order = DOCUMENT(product.order_id)          
          FILTER ${!!order_key} ? product.order_id == ${'Clients/' + order_key} : true
          FILTER ${!!search} ? REGEX_TEST(product.name, ${search}, true) : true
          SORT product.createdAt DESC          
          RETURN MERGE(product, {order: order})`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    products,
  };
}

async function getProduct(ctx) {
  const {
    _key
  } = ctx.params;
  let product = await db
    .query(
      aql `FOR product IN Products
          FILTER product._key == ${_key}          
          RETURN MERGE(product, {order: DOCUMENT(product.order_id)})`
    )
    .then((cursor) => {
      return cursor.next();
    });
  if (!product) ctx.throw(404);
  ctx.body = {
    product,
  };
}

async function createProduct(ctx) {
  const {
    createProductDto
  } = ctx.request.body;
  //todo: validation
  let productData = createProductDto;
  productData.createdBy = ctx.state.user._id;
  productData.createdAt = new Date();
  const productsCollection = db.collection("Products");
  const product = await productsCollection.save(productData, true);
  ctx.body = {
    product,
  };
}

async function updateProduct(ctx) {
  const {
    _key
  } = ctx.params;
  const {
    user
  } = ctx.state;
  const productsCollection = db.collection("Products");
  const product = productsCollection.document(_key);
  if (!product) ctx.throw(404);
  let {
    updateProductDto
  } = ctx.request.body;
  let productData = Joi.attempt(updateProductDto, updateProductSchema.unknown()); // {stripUnknown: true}
  productData.updatedBy = user._id;
  productData.updatedAt = new Date();
  const meta = await productsCollection.update(_key, productData, true);
  ctx.body = {
    meta,
  };
}

async function deleteProduct(ctx) {
  const {
    _key
  } = ctx.params;
  const productsCollection = db.collection("Products");
  const product = await productsCollection.document(_key);
  if (!product) ctx.throw(404, 'Product not found');
  // todo: verify deletion of the product
  await productsCollection.remove(_key);
  ctx.body = {
    result: "OK",
  };
}

router
  .post("/", authorize(["palam", "vova"]), createProduct)
  .get("/", findProducts)
  .get("/:_key", getProduct)
  .put("/:_key", authorize(["palam", "vova"]), updateProduct)
  .delete("/:_key", authorize(["palam", "vova"]), deleteProduct);

module.exports = router.routes();