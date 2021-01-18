const Joi = require('@hapi/joi');
const _ = require('lodash');
const Util = require('util');
const Boom = require('@hapi/boom');
const Errors = require('../../commons/errors');
const PromoCodeModel = require('../../models/promo-code');
const Constants = require('../../commons/constants');
const validator = PromoCodeModel.validatorRules();

const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Delete Promo Code - Access - admin',
  tags: ['api'],
  validate: {
    params: Joi.object({
      id: validator.id.required(),
    }),
    query: Joi.object({
      hardDeleteFlag: Joi.boolean()
        .default(false)
        .description('Hard delete flag')
        .optional(),
    }),
  },
  handler: async (request, _h) => {
    const id = _.get(request, 'params.id');
    const promoCode = await PromoCodeModel.findOne(
      PromoCodeModel.buildCriteria('id', id),
    );
    if (_.isEmpty(promoCode))
      throw Boom.notFound(Util.format(Errors.notFound, 'Promo Code'));
    try {
      await PromoCodeModel.deleteAll(
        PromoCodeModel.buildCriteria('id', id),
        request.query.hardDeleteFlag,
      );
      return Constants.SUCCESS_RESPONSE;
    } catch (err) {
      throw Boom.internal(err);
    }
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['DELETE'],
    path: '/api/promo-codes/{id}',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
