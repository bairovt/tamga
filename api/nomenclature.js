'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const { nomenSchema } = require('../schemas/productSchemas');
const Nomen = require('../models/Nomen');

const router = new Router();

async function findNomens(ctx) {
  let { search = '' } = ctx.query;
  search = search.trim();
  search = search.replace(/\s/g, ',prefix:');
  search = search ? 'prefix:' + search : search;

  let nomens = await db
    // an arango error is thown when search starts with a comma
    .query(
      aql`FOR nomen IN ${!!search} ? FULLTEXT(Nomen, "name", ${search}) : Nomen
          LET tnved = DOCUMENT(CONCAT('Tnved/', nomen.tnved))
          SORT nomen.createdAt DESC
          RETURN MERGE(nomen, {its: tnved.its})`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    nomens,
  };
}

async function createNomen(ctx) {
  const { createNomenDto } = ctx.request.body;
  let nomenData = Joi.attempt(createNomenDto, nomenSchema, {
    stripUnknown: true,
  });
  const nomen = await Nomen.create(nomenData, ctx.state.user);
  ctx.body = {
    nomen,
  };
}

async function updateNomen(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  let { updateNomenDto } = ctx.request.body;
  let nomenData = Joi.attempt(updateNomenDto, nomenSchema, {
    stripUnknown: true,
  });
  nomenData.updatedBy = user._id;
  nomenData.updatedAt = new Date();
  const meta = await db.collection('Nomen').update(_key, nomenData, true);
  ctx.body = {
    meta,
  };
}

async function deleteNomen(ctx) {
  // todo: verify deletion of the nomen
  const { _key } = ctx.params;
  await db.collection('Nomen').remove(_key);
  ctx.body = {
    result: 'OK',
  };
}

router
  .post('/', authorize(['logist']), createNomen)
  .get('/', findNomens)
  .put('/:_key', authorize(['logist']), updateNomen)
  .delete('/:_key', authorize(['logist']), deleteNomen);

module.exports = router.routes();
