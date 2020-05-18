const Joi = require('@hapi/joi');

const arangoIdSchema = Joi.string()
  .trim()
  .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/)
  .min(3)
  .max(50);

module.exports = { arangoIdSchema };
