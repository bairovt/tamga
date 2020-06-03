'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');

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

  const products = await db
    .query(
      aql`FOR shift IN shifts
          LET product = DOCUMENT(shift.product_id)
          LET nomen = DOCUMENT(product.nomen_id)                    
          RETURN {
            name: nomen.name,
            measure: nomen.measure,             
            its: product.its,             
            pack: product.pack,             
            qty: shift.qty,
            seats: shift.seats 
          }`
    )
    .then((cursor) => {
      return cursor.all();
    });

  ctx.body = {
    repo,
    products,
  };
}

router.get('/', getRepos).get('/:_key', getRepo).get('/:_key/products', getRepoProducts);

module.exports = router.routes();
