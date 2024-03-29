'use strict';
const http = require('http'),
  Koa = require('koa'),
  config = require('config'),
  Router = require('koa-router'),
  logger = require('koa-logger'),
  cors = require('./middleware/cors'),
  errorHandler = require('./middleware/error-handler');

const app = new Koa();
const server = http.createServer(app.callback());

/* middlewares */
app.use(cors); // use cors to allow requests from different origin (localhost:8080 - on dev e.g.)
// if (app.env === 'development') app.use(logger())
app.use(logger());

app.use(require('koa-bodyparser')());
app.use(errorHandler);

/* authentication middleware */
app.use(require('./middleware/authentication'));

/* api routing */
const router = new Router();
router
  .use('/api/users', require('./api/users'))
  .use('/api/clients', require('./api/clients'))
  .use('/api/orders', require('./api/orders'))
  .use('/api/products', require('./api/products'))
  .use('/api/nomenclature', require('./api/nomenclature'))
  .use('/api/sklads', require('./api/sklads'))
  .use('/api/bundles', require('./api/bundles'))
  .use('/api/shifts', require('./api/shifts'));

app.use(router.routes());

/* start koa server */
if (module.parent) {
  module.exports = app;
} else {
  let port = config.server.port;
  server.listen(port);
  console.log(`tamga-srv listening on port ${port}`);
}
