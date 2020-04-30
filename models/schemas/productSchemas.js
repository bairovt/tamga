const Joi = require('joi');

const arangoIdSchema = Joi.string().trim().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/).min(3).max(50);

const productSchema = Joi.object().keys({
  // tnved: Joi.string().trim().regex(/^\d+$/).min(10).max(10).empty('').required(),
  tnved: Joi.string().trim().regex(/^[\d+]{10,10}$/).empty('').required(),
  name: Joi.string().trim().min(2).max(255).required(),
  packType: Joi.string().valid('44', '5H').empty('').allow(null),
  measure: Joi.string().valid('шт', 'литр').required(),
  seats: Joi.number(),
  qty: Joi.number(),
  wnetto: Joi.number(),
  wbrutto: Joi.number(),
  cvi: Joi.number(),
  info: Joi.string().trim().min(1).max(5000).empty('').allow(null)
});

module.exports = {
  productSchema
}