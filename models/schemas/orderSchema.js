const Joi = require('@hapi/joi');

const arangoIdSchema = Joi.string()
  .trim()
  .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/)
  .min(3)
  .max(50);

const orderSchema = Joi.object().keys({
  client_id: arangoIdSchema.required(),
  info: Joi.string().trim().min(1).max(5000).empty('').allow(null),
  status: Joi.string().valid('NEW', 'DONE'),
});

module.exports = orderSchema;
