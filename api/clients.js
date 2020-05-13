'use strict';
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const Router = require('koa-router');
const authorize = require('../middleware/authorize');
const Joi = require('@hapi/joi');
const clientSchema = require('../models/schemas/clientSchema');

const router = new Router();

async function findClients(ctx) {
  let search = ctx.query.search || '';
  let clients = await db
    .query(
      aql`FOR cl IN Clients
          FILTER ${!search} ? true : (REGEX_TEST(cl.name, ${search}, true) OR
            REGEX_TEST(cl.info, ${search}, true))
          SORT cl.createdAt DESC
          RETURN cl`
    )
    .then((cursor) => {
      return cursor.all();
    });
  ctx.body = {
    clients,
  };
}

async function getClient(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  const clientsCollection = db.collection('Clients');
  const client = await clientsCollection.document(_key);
  if (!client) ctx.throw(404);
  // client.editable = await user.hasRoles(['palam']);
  ctx.body = {
    client,
  };
}

async function createClient(ctx) {
  const { createClientDto } = ctx.request.body;
  let clientData = Joi.attempt(createClientDto, clientSchema);
  clientData.createdBy = ctx.state.user._id;
  clientData.createdAt = new Date();
  const clientsCollection = db.collection('Clients');
  const newClient = await clientsCollection.save(clientData);
  ctx.body = {
    newClientKey: newClient._key,
  };
}

async function updateClient(ctx) {
  const { _key } = ctx.params;
  const { user } = ctx.state;
  const clientsCollection = db.collection('Clients');
  const client = clientsCollection.document(_key);
  if (!client) ctx.throw(404);
  let { updateClientDto } = ctx.request.body;
  let clientData = Joi.attempt(updateClientDto, clientSchema.unknown()); // {stripUnknown: true}
  clientData.updatedBy = user._id;
  clientData.updatedAt = new Date();
  await clientsCollection.update(_key, clientData);
  ctx.body = {
    result: 'OK',
  };
}

async function deleteClient(ctx) {
  const { _key } = ctx.params;
  const clientsCollection = db.collection('Clients');
  const client = await clientsCollection.document(_key);
  if (!client) ctx.throw(404);
  //todo: НЕ удаляем если есть зависимости: orders, (client.findOrders('STATUS'))
  await clientsCollection.remove(_key);
  ctx.body = {
    result: 'OK',
  };
}

router
  .post('/', authorize(['palam', 'vova']), createClient)
  .get('/', findClients)
  .get('/:_key', getClient)
  .patch('/:_key', authorize(['palam', 'vova']), updateClient)
  .delete('/:_key', authorize(['palam', 'vova']), deleteClient);

module.exports = router.routes();
