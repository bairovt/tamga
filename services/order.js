const Nomen = require('../models/Nomen');
const Product = require('../models/Product');
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const { func } = require('@hapi/joi');

async function checkIsNew(_id) {
  let count = await db
    .query(
      aql`FOR p IN Product
          FILTER p.order_id == ${_id}
          COLLECT WITH COUNT INTO cnt
          RETURN cnt`
    )
    .then((cursor) => cursor.next());

  if (count === 0) {
    await db.collection('Order').update(_id, { status: 'NEW', takenOn: null });
  }
}

module.exports = { checkIsNew };
