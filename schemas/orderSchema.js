const Joi = require('@hapi/joi');
const { arangoIdSchema } = require('./common');

const orderSchema = Joi.object().keys({
  client_id: arangoIdSchema.required(),
  info: Joi.string().trim().min(1).max(5000).empty('').allow(null),
  status: Joi.string().valid('NEW', 'DONE'),
});

module.exports = orderSchema;
