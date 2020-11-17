/* eslint-disable no-restricted-syntax */
const Boom = require('@hapi/boom');
const moment = require('moment-timezone');
const Util = require('util');
const Errors = require('../app/commons/errors');
const PromoCodeModel = require('../app/models/promo-code');
const TransactionModel = require('../app/models/transaction');

const promoRedeemHandler = async ({ userId, promoCode, price }) => {
  const retrievedPromoCode = await PromoCodeModel.findOne(
    PromoCodeModel.buildCriteria('code', promoCode),
  );
  if (!retrievedPromoCode) {
    throw Boom.notFound(Util.format(Errors.notFound, 'Promo Code'));
  }
  const promises = [];
  promises.push(
    TransactionModel.count([
      TransactionModel.buildCriteria('promoCodeId', retrievedPromoCode.id),
    ]),
    TransactionModel.count([
      TransactionModel.buildCriteria('promoCodeId', retrievedPromoCode.id),
      TransactionModel.buildCriteria('userId', userId),
    ]),
  );
  const [totalRedemptionCount, userRedemptionCount] = await Promise.all(
    promises,
  );

  const now = moment();
  if (
    retrievedPromoCode.validityEndDateTimeTZ &&
    now > moment(retrievedPromoCode.validityEndDateTimeTZ)
  ) {
    throw Boom.badRequest(Errors.invalidCode);
  } else if (
    retrievedPromoCode.validityStartDateTimeTZ &&
    now < moment(retrievedPromoCode.validityStartDateTimeTZ)
  ) {
    throw Boom.badRequest(Errors.invalidCode);
  } else if (
    retrievedPromoCode.maxRedemptionCount !== null &&
    totalRedemptionCount >= retrievedPromoCode.maxRedemptionCount
  ) {
    throw Boom.badRequest(Errors.invalidCode);
  } else if (retrievedPromoCode.isOneTimePerGuest && userRedemptionCount >= 1) {
    throw Boom.badRequest(Errors.invalidCode);
  }

  let resultPrice;
  if (retrievedPromoCode.isDiscountPercentage) {
    resultPrice = Math.round(
      price - (price * retrievedPromoCode.discountValue) / 100,
    );
  } else {
    resultPrice = price - retrievedPromoCode.discountValue;
  }
  if (resultPrice < 0) {
    resultPrice = 0;
  }
  return { price: resultPrice, promoCodeId: retrievedPromoCode.id };
};
module.exports = promoRedeemHandler;
