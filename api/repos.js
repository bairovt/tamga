'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const { getDirectedShifts, groupShiftsByProduct, balance } = require('../services/shifts');

const router = new Router();

async function getRepos(ctx) {
  let repos = await db
    .query(
      aql`FOR repo IN Repo          
          SORT repo.name DESC
          RETURN repo`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    repos,
  };
}

async function getRepo(ctx) {
  const { _key } = ctx.params;
  const repo = await db.collection('Repo').document(_key);
  ctx.body = {
    repo,
  };
}

async function getRepoProducts(ctx) {
  const { _key } = ctx.params;

  const repo = await db.collection('Repo').document(_key);

  const toShifts = await getDirectedShifts('to', repo._id);
  const fromShifts = await getDirectedShifts('from', repo._id);

  const toProducts = groupShiftsByProduct(toShifts);
  const fromProducts = groupShiftsByProduct(fromShifts);

  const products = balance(toProducts, fromProducts);

  ctx.body = {
    repo,
    products,
  };
}

router.get('/', getRepos).get('/:_key', getRepo).get('/:_key/products', getRepoProducts);

module.exports = router.routes();
