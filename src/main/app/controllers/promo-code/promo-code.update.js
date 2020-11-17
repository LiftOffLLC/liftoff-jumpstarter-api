const Joi = require('@hapi/joi');
const _ = require('lodash');
const Util = require('util');
const moment = require('moment-timezone');
const Boom = require('@hapi/boom');
const Errors = require('../../commons/errors');
const PromoCodeModel = require('../../models/promo-code');
const Constants = require('../../commons/constants');
const validator = PromoCodeModel.validatorRules();
const dateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';
const timezone = 'America/Los_Angeles';

const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Update Promo Code - Access - admin',
  tags: ['api'],
  validate: {
    params: Joi.object({
      id: validator.id.required(),
    }),
    payload: Joi.object({
      code: validator.code.optional(),
      isDiscountPercentage: validator.isDiscountPercentage.optional(),
      discountValue: validator.discountValue.optional(),
      validityStartDateTime: validator.validityStartDateTime.optional(),
      validityEndDateTime: Joi.any().when('validityStartDateTime', {
        is: Joi.exist(),
        then: validator.validityEndDateTime
          .greater(Joi.ref('validityStartDateTime'))
          .optional(),
        otherwise: validator.validityEndDateTime.optional(),
      }),
      isOneTimePerGuest: validator.isOneTimePerGuest.optional(),
      note: validator.note.optional(),
    }).min(1),
  },
  handler: async (request, _h) => {
    const id = _.get(request, 'params.id');
    const { payload } = request;
    const promoCode = await PromoCodeModel.findOne(
      PromoCodeModel.buildCriteria('id', id),
    );
    if (_.isEmpty(promoCode))
      throw Boom.notFound(Util.format(Errors.notFound, 'Promo Code'));
    if (payload.validityStartDateTime) {
      const startDateTime = moment.tz(payload.validityStartDateTime, timezone);
      payload.validityStartDateTime = startDateTime.format(dateTimeFormat);
      payload.validityStartDateTimeTZ = startDateTime.toISOString();
    }
    if (payload.validityEndDateTime) {
      const endDateTime = moment.tz(payload.validityEndDateTime, timezone);
      payload.validityEndDateTime = endDateTime.format(dateTimeFormat);
      payload.validityEndDateTimeTZ = endDateTime.toISOString();
    }

    if (
      payload.validityStartDateTimeTZ &&
      !payload.validityEndDateTimeTZ &&
      promoCode.validityEndDateTimeTZ
    ) {
      if (
        moment(payload.validityStartDateTimeTZ) >=
        moment(promoCode.validityEndDateTimeTZ)
      ) {
        throw Boom.badRequest(Errors.invalidStartDate);
      }
    } else if (
      payload.validityEndDateTimeTZ &&
      !payload.validityStartDateTimeTZ &&
      promoCode.validityStartDateTimeTZ
    ) {
      if (
        moment(promoCode.validityStartDateTimeTZ) >=
        moment(payload.validityEndDateTimeTZ)
      ) {
        throw Boom.badRequest(Errors.invalidEndDate);
      }
    }
    payload.id = request.params.id;
    const toUpdatePromoCode = {
      ...payload,
    };
    const updatedPromoCode = await PromoCodeModel.createOrUpdate(
      toUpdatePromoCode,
    );
    return updatedPromoCode;
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['PUT'],
    path: '/api/promo-codes/{id}',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
