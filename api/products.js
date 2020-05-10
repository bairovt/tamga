'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const { productSchema } = require('../models/schemas/productSchemas');

const router = new Router();

async function findProducts(ctx) {
  let { search = '', order_key = '' } = ctx.query;
  let products = await db
    .query(
      aql`FOR product IN Products
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
  const { _key } = ctx.params;
  let product = await db
    .query(
      aql`FOR product IN Products
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
  const { createProductDto, order_id } = ctx.request.body;
  let productData = Joi.attempt(createProductDto, productSchema, {
    stripUnknown: true,
  });
  productData.order_id = order_id;
  productData.createdBy = ctx.state.user._id;
  productData.createdAt = new Date();
  const productsCollection = db.collection('Products');
  const product = await productsCollection.save(productData, true);
  ctx.body = {
    product,
  };
}

async function updateProduct(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  const productsCollection = db.collection('Products');
  const product = productsCollection.document(_key);
  if (!product) ctx.throw(404);
  let { updateProductDto } = ctx.request.body;
  let productData = Joi.attempt(updateProductDto, productSchema, {
    stripUnknown: true,
  });
  productData.updatedBy = user._id;
  productData.updatedAt = new Date();
  const meta = await productsCollection.update(_key, productData, true);
  ctx.body = {
    meta,
  };
}

async function deleteProduct(ctx) {
  // todo: verify deletion of the product
  const { _key } = ctx.params;
  await db.collection('Products').remove(_key);
  ctx.body = {
    result: 'OK',
  };
}

async function deleteProducts(ctx) {
  const { productKeys } = ctx.request.body;
  const productsColl = db.collection('Products');
  const removePromises = productKeys.map((key) => productsColl.remove(key));
  await Promise.all(removePromises);
  ctx.body = {
    result: 'OK',
  };
}

router
  .post('/', authorize(['palam', 'vova']), createProduct)
  .get('/', findProducts)
  .get('/:_key', getProduct)
  .put('/:_key', authorize(['palam', 'vova']), updateProduct)
  .delete('/:_key', authorize(['palam', 'vova']), deleteProduct)
  .delete('/', authorize(['palam', 'vova']), deleteProducts)

module.exports = router.routes();
