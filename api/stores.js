'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');

const router = new Router();

async function getStores(ctx) {
  let stores = await db
    .query(
      aql`FOR store IN Stores          
          SORT store.name DESC
          RETURN store`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    stores,
  };
}

async function getStore(ctx) {
  const { _key } = ctx.params;
  const store = await db.collection('Stores').document(_key);
  ctx.body = {
    store,
  };
}

router.get('/', getStores).get('/:_key', getStore);

module.exports = router.routes();
