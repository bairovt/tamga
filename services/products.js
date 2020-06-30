const Nomen = require('../models/Nomen');
const Product = require('../models/Product');
const db = require('../lib/arangodb');
const aql = require('arangojs').aql;
const { func } = require('@hapi/joi');

async function createNomenProduct(ctx, nomenData, productData) {
  const nomen = await Nomen.getOrCreate(nomenData, ctx.state.user);

  productData.nomen_id = nomen._id;
  const product = await Product.create(productData, ctx.state.user);
  return {
    product: { ...nomen, ...product },
  };
}

async function isProductShifted(_key) {
  let shift = await db
    .query(
      aql`FOR shift IN Shift
          FILTER shift.product_id == ${'Product/' + _key}
          RETURN shift`
    )
    .then((cursor) => cursor.next());

  return !!shift;
}

module.exports = { createNomenProduct, isProductShifted };
