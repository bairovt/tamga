'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const { productSchema, combinedProductSchema } = require('../schemas/productSchemas');

const productSrvices = require('../services/products');

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
  let { createProductDto } = ctx.request.body;

  createProductDto = Joi.attempt(createProductDto, combinedProductSchema, {
    stripUnknown: true,
  });

  const product = await productSrvices.createProduct(ctx.state.user, createProductDto);

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
  const products = [];
  lines.forEach((line, idx, lines) => {
    const cols = line.split('\t');
    const createProductDto = {
      order_id,
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
      fromCsv: true,
    };
    let productData = Joi.attempt(createProductDto, combinedProductSchema);
    products.push(productData);
  });

  for await (let productData of products) {
    await productSrvices.createProduct(ctx.state.user, productData);
  }

  ctx.body = {
    productsCnt: products.length,
  };
}

async function updateProduct(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  let { updateProductDto } = ctx.request.body;
  let productData = Joi.attempt(updateProductDto, combinedProductSchema, {
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
