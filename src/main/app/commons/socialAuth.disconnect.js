const _ = require('lodash');
const Joi = require('@hapi/joi');

const UserModel = require('../models/user');
const SocialLoginModel = require('../models/social-login');
const isAuthorized = require('../policies/isAuthorized');
const Constants = require('./constants');

const validator = UserModel.validatorRules();

module.exports = function socialDisconnect(providerName) {
  const options = {
    auth: Constants.AUTH.ADMIN_OR_USER,
    description: `Disconnect ${providerName} - Access - ALL`,
    tags: ['api'],
    validate: {
      params: Joi.object({
        userId: validator.id.required(),
      }),
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [201, 403]),
      },
      policies: [isAuthorized('params.userId')],
    },
    handler: async (request, _h) => {
      const criteria = SocialLoginModel.buildCriteriaWithObject({
        provider: providerName,
        userId: request.params.userId,
      });
      await SocialLoginModel.deleteAll(criteria, false);
      return Constants.SUCCESS_RESPONSE;
    },
  };

  return () => ({
    method: ['DELETE'],
    path: `/api/users/{userId}/${providerName}/disconnect`,
    options,
  });
};
