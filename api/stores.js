'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');

const router = new Router();

async function getRepos(ctx) {
  let repos = await db
    .query(
      aql`FOR repo IN Repos          
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
  const repo = await db.collection('Repos').document(_key);
  ctx.body = {
    repo,
  };
}

  ctx.body = {
    store,
  };
}

router.get('/', getRepos).get('/:_key', getRepo);

module.exports = router.routes();
