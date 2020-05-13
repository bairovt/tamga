const Joi = require('@hapi/joi');

const clientSchema = Joi.object().keys({
  name: Joi.string().trim().min(2).max(100).required(),
  // tel: Joi.string().trim().regex(/^\d+$/).min(5).max(20).empty('').required(),
  // location: Joi.string().trim().min(1).max(255).empty('').allow(null),
  info: Joi.string().trim().min(1).max(5000).empty('').allow(null),
});

module.exports = clientSchema;
