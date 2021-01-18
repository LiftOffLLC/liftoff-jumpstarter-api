const PromoCodeModel = require('../../models/promo-code');
const { readAPI } = require('../../commons/read.api');
const Constants = require('../../commons/constants');

module.exports = {
  enabled: true,
  operation: readAPI(
    'promo-codes',
    {
      auth: Constants.AUTH.ADMIN_OR_USER,
    },
    PromoCodeModel,
  ),
};
