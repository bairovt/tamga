'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const { nomenSchema, productSchema } = require('../models/schemas/productSchema');

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
  let nameData = Joi.attempt(createProductDto, nomenSchema, {
    stripUnknown: true,
  });
  let productData = Joi.attempt(createProductDto, productSchema, {
    stripUnknown: true,
  });

  nameData.createdBy = ctx.state.user._id;
  nameData.createdAt = new Date();
  const nomenMeta = await db.collection('Nomens').save(nameData, true);

  productData.order_id = order_id;
  productData.name_id = nomenMeta._id;
  productData.createdBy = ctx.state.user._id;
  productData.createdAt = new Date();
  const productMeta = await db.collection('Products').save(productData, true);
  const product = { ...nomenMeta.new, ...productMeta.new };
  ctx.body = {
    product,
  };
}

async function createProductsFromCsv(ctx) {
  let { fromSpec, order_id, csv } = ctx.request.body;

  csv = csv.trim();
  const originalLines = csv.split(/\r?\n/);

  csv = csv.replace(/\$/g, '');
  csv = csv.replace(/,/g, '.');
  const lines = csv.split(/\r?\n/);

  if (fromSpec) {
    // replace only first occurance in each line
    lines.forEach((line, idx, lines) => {
      lines[idx] = line.replace(/\t\t\t/, '\t');
    });
  }
  const productsColl = db.collection('Products');
  const products = [];

  lines.forEach((line, idx, lines) => {
    const cols = line.split('\t');
    const createProductDto = {
      tnved: cols[0],
      name: cols[1],
      packType: cols[2],
      measure: cols[3],
      seats: cols[4],
      qty: cols[5],
      wnetto: cols[6],
      wbrutto: cols[7],
      its: cols[8],
      comment: originalLines[idx],
    };
    let productData = Joi.attempt(createProductDto, productSchema, {
      stripUnknown: true,
    });
    productData.order_id = order_id;
    productData.createdBy = ctx.state.user._id;
    productData.createdAt = new Date();
    productData.fromCsv = true;
    products.push(productData);
  });

  await productsColl.import(products, { type: 'documents', complete: true });
  ctx.body = {
    productsCnt: products.length,
  };
}

async function updateProduct(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  let { updateProductDto } = ctx.request.body;
  let productData = Joi.attempt(updateProductDto, productSchema, {
    stripUnknown: true,
  });
  productData.updatedBy = user._id;
  productData.updatedAt = new Date();
  const meta = await db.collection('Products').update(_key, productData, true);
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
  // todo: make within a transaction
  // https://github.com/arangodb/arangojs/blob/master/docs/Drivers/JS/Reference/Database/Transactions.md
  const { productKeys } = ctx.request.body;
  const productsColl = db.collection('Products');
  const removePromises = productKeys.map((key) => productsColl.remove(key));
  await Promise.all(removePromises);
  ctx.body = {
    result: 'OK',
  };
}

router
  .post('/', authorize(['logist']), createProduct)
  .get('/', findProducts)
  .get('/:_key', getProduct)
  .put('/:_key', authorize(['logist']), updateProduct)
  .delete('/:_key', authorize(['logist']), deleteProduct)
  .delete('/', authorize(['logist']), deleteProducts)
  .post('/csv', authorize(['logist']), createProductsFromCsv);

module.exports = router.routes();
