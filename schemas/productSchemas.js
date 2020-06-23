const Joi = require('@hapi/joi');
const { packTypes, measureUnits } = require('../consts');
const { arangoIdSchema } = require('./common');

// const packTypeValues = packTypes.map((pack) => pack.value);

const nomenSchema = Joi.object().keys({
  tnved: Joi.string()
    .trim()
    .regex(/^[\d+]{10,10}$/)
    .empty('')
    .required(),
  name: Joi.string().trim().uppercase({ force: true }).min(3).max(555).required(),
  measure: Joi.string()
    .valid(...measureUnits)
    .required(),
  comment: Joi.string().trim().min(1).max(5000).empty('').allow(null),
  fromCsv: Joi.boolean().allow(null),
});

const productSchema = Joi.object().keys({
  order_id: arangoIdSchema,
  client_id: arangoIdSchema,
  nomen_id: arangoIdSchema,
  pack: Joi.string().allow('').max(255),
  seats: Joi.number().min(0).empty('').default(0),
  qty: Joi.number().min(0).empty('').default(0),
  wnetto: Joi.number().min(0).empty('').default(0),
  wbrutto: Joi.number().min(0).empty('').default(0),
  its: Joi.number().min(0).empty('').default(0),
  comment: Joi.string().trim().min(1).max(5000).empty('').allow(null),
  fromCsv: Joi.boolean().allow(null),
});

const combinedProductSchema = nomenSchema.concat(productSchema);

module.exports = { nomenSchema, productSchema, combinedProductSchema };
