const Joi = require('@hapi/joi');
const _ = require('lodash');
const moment = require('moment-timezone');
const PromoCodeModel = require('../../models/promo-code');
const Constants = require('../../commons/constants');
const validator = PromoCodeModel.validatorRules();
const dateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';

const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Create Promo Code - Access - admin',
  tags: ['api'],
  validate: {
    payload: Joi.object({
      code: validator.code.required(),
      isDiscountPercentage: validator.isDiscountPercentage.required(),
      discountValue: validator.discountValue.required(),
      validityStartDateTime: validator.validityStartDateTime.optional(),
      validityEndDateTime: Joi.any().when('validityStartDateTime', {
        is: Joi.exist(),
        then: validator.validityEndDateTime
          .greater(Joi.ref('validityStartDateTime'))
          .optional(),
        otherwise: validator.validityEndDateTime.optional(),
      }),
      timezone: validator.timezone,
      isOneTimePerGuest: validator.isOneTimePerGuest.required(),
      note: validator.note.optional(),
    })
      .with('validityStartDateTime', 'timezone')
      .with('validityEndDateTime', 'timezone'),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [200]),
    },
  },
  handler: async (request, h) => {
    const { payload } = request;
    if (payload.validityStartDateTime) {
      const startDateTime = moment.tz(
        payload.validityStartDateTime,
        payload.timezone,
      );
      payload.validityStartDateTime = startDateTime.format(dateTimeFormat);
      payload.validityStartDateTimeTZ = startDateTime.toISOString();
    }
    if (payload.validityEndDateTime) {
      const endDateTime = moment.tz(
        payload.validityEndDateTime,
        payload.timezone,
      );
      payload.validityEndDateTime = endDateTime.format(dateTimeFormat);
      payload.validityEndDateTimeTZ = endDateTime.toISOString();
    }
    const promoCode = _.omit(payload, 'timezone');
    const resultPromoCode = await PromoCodeModel.createOrUpdate(promoCode);
    return h.response(resultPromoCode).code(201);
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['POST'],
    path: '/api/promo-codes',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
