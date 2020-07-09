'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const { getDirectedShifts, groupShiftsByProduct, balance } = require('../services/shift-service');

const router = new Router();

async function getBundles(ctx) {
  let bundles = await db
    .query(
      aql`FOR bundle IN Bundle          
          SORT bundle.name DESC
          RETURN bundle`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    bundles,
  };
}

async function getBundle(ctx) {
  const { _key } = ctx.params;
  const bundle = await db.collection('Bundle').document(_key);
  ctx.body = {
    bundle,
  };
}

async function getBundleProducts(ctx) {
  const { _key } = ctx.params;

  const bundle = await db.collection('Bundle').document(_key);

  const toShifts = await getDirectedShifts('to', bundle._id);
  const fromShifts = await getDirectedShifts('from', bundle._id);

  const toProducts = groupShiftsByProduct(toShifts);
  const fromProducts = groupShiftsByProduct(fromShifts);

  const products = balance(toProducts, fromProducts);

  ctx.body = {
    bundle,
    products,
  };
}

router.get('/', getBundles).get('/:_key', getBundle).get('/:_key/products', getBundleProducts);

module.exports = router.routes();
