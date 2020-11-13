const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const moment = require('moment');
const _ = require('lodash');
const BaseModel = require('./base');
const dateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';

module.exports = class PromoCode extends BaseModel {
  static get tableName() {
    return 'PromoCode';
  }

  static entityFilteringScope() {
    const omitFields = ['isActive'];
    return {
      admin: omitFields,
      user: omitFields,
      guest: omitFields,
    };
  }

  static validatorRules() {
    const rules = {
      id: Joi.number().integer().positive().description('Promo Code Id'),
      code: Joi.string()
        .trim()
        .min(3)
        .max(20)
        .regex(/^[A-Z0-9]+$/)
        .description('Promo Code in uppercase alphanumeric'),
      isDiscountPercentage: Joi.boolean().description(
        'Is Discount Percentage?',
      ),
      discountValue: Joi.number().integer().positive().description('Id'),
      timezone: Joi.string()
        .description('Timezone')
        .valid(..._.values(moment.tz.names())),
      validityStartDateTime: Joi.date()
        .utc()
        .format(dateTimeFormat)
        .description('Validity Start Time'),
      validityEndDateTime: Joi.date()
        .utc()
        .format(dateTimeFormat)
        .description('Validity End Time'),
      isOneTimePerGuest: Joi.boolean().description('Is One Time Per Guest?'),
      note: Joi.string().trim().description('Note'),
    };
    return rules;
  }
};
