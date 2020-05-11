const Joi = require('@hapi/joi');
const { packTypes, measureUnits } = require('../../consts');

const arangoIdSchema = Joi.string()
  .trim()
  .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9]+$/)
  .min(3)
  .max(50);

const packTypeValues = packTypes.map((pack) => pack.value);

const productSchema = Joi.object().keys({
  // tnved: Joi.string().trim().regex(/^\d+$/).min(10).max(10).empty('').required(),
  tnved: Joi.string()
    .trim()
    .regex(/^[\d+]{10,10}$/)
    .empty('')
    .required(),
  name: Joi.string().trim().min(3).max(555).required(),
  packType: Joi.string()
    .valid(...packTypeValues)
    .empty('')
    .allow(null),
  measure: Joi.string()
    .valid(...measureUnits)
    .required(),
  seats: Joi.number().min(0).empty('').default(0),
  qty: Joi.number().min(0).empty('').default(0),
  wnetto: Joi.number().min(0).empty('').default(0),
  wbrutto: Joi.number().min(0).empty('').default(0),
  cvi: Joi.number().min(0).empty('').default(0),
  comment: Joi.string().trim().min(1).max(5000).empty('').allow(null),
});

module.exports = {
  productSchema,
};
