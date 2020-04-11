const Joi = require('joi');

const arangoIdSchema = Joi.string().trim().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/).min(3).max(50);

const orderSchema = Joi.object().keys({
  date: Joi.date().iso().required(),
  total: Joi.number().required(),
  comment: Joi.string().trim().min(1).max(5000).empty('').allow(null),
  client_id: arangoIdSchema.required(),
  status: Joi.string().valid("CREATED", "DELIVERED").required()
});

const clientSchema = Joi.object().keys({
  name: Joi.string().trim().min(2).max(100).required(),
  // tel: Joi.string().trim().regex(/^\d+$/).min(5).max(20).empty('').required(),
  // location: Joi.string().trim().min(1).max(255).empty('').allow(null),
  info: Joi.string().trim().min(1).max(5000).empty('').allow(null),
});

module.exports = {
  clientSchema,
  orderSchema
}