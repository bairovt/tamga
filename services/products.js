const Nomen = require('../models/Nomen');
const Product = require('../models/Product');

async function createNomenProduct(ctx, nomenData, productData) {
  const nomen = await Nomen.getOrCreate(nomenData, ctx.state.user);

  productData.nomen_id = nomen._id;
  const product = await Product.create(productData, ctx.state.user);
  return {
    product: { ...nomen, ...product },
  };
}

module.exports = { createNomenProduct };
