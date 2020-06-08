'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const { getDirectedShifts, groupShiftsByProduct, balance } = require('../services/shifts');

const router = new Router();

async function getSklads(ctx) {
  let sklads = await db
    .query(
      aql`FOR sklad IN Sklad          
          SORT sklad.name DESC
          RETURN sklad`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    sklads,
  };
}

async function getSklad(ctx) {
  const { _key } = ctx.params;
  const sklad = await db.collection('Sklad').document(_key);
  ctx.body = {
    sklad,
  };
}

async function getSkladProducts(ctx) {
  const { _key } = ctx.params;

  const sklad = await db.collection('Sklad').document(_key);

  const toShifts = await getDirectedShifts('to', sklad._id);
  const fromShifts = await getDirectedShifts('from', sklad._id);

  const toProducts = groupShiftsByProduct(toShifts);
  const fromProducts = groupShiftsByProduct(fromShifts);

  const products = balance(toProducts, fromProducts);

  ctx.body = {
    sklad,
    products,
  };
}

router.get('/', getSklads).get('/:_key', getSklad).get('/:_key/products', getSkladProducts);

module.exports = router.routes();
