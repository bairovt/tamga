const Joi = require('@hapi/joi');
const Nomen = require('../models/Nomen');
const Product = require('../models/Product');
const { nomenSchema, productSchema } = require('../schemas/productSchemas');

async function createProduct(user, createProductDto) {
  const nomenData = Joi.attempt(createProductDto, nomenSchema, {
    stripUnknown: true,
  });
  const productData = Joi.attempt(createProductDto, productSchema, {
    stripUnknown: true,
  });

  const nomen = await Nomen.getOrCreate(nomenData, user);

  productData.nomen_id = nomen._id;
  const product = await Product.create(productData, user);
  return {
    product: { ...nomen, ...product },
  };
}

module.exports = { createProduct };
