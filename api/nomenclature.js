'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const { nomenSchema } = require('../models/schemas/productSchema');

const router = new Router();

async function findNomens(ctx) {
  let { search = '' } = ctx.query;
  let nomens = await db
    .query(
      aql`FOR nomen IN Nomens          
          FILTER ${!!search} ? REGEX_TEST(nomen.name, ${search}, true) : true
          SORT nomen.createdAt DESC
          RETURN MERGE(nomen)`
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
  nomenData.createdBy = ctx.state.user._id;
  nomenData.createdAt = new Date();
  const nomenMeta = await db.collection('Nomens').save(nomenData, true);
  ctx.body = {
    nomen: nomenMeta.new,
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
  const meta = await db.collection('Nomens').update(_key, nomenData, true);
  ctx.body = {
    meta,
  };
}

async function deleteNomen(ctx) {
  // todo: verify deletion of the nomen
  const { _key } = ctx.params;
  await db.collection('Nomens').remove(_key);
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
