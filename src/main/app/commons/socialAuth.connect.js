const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const Util = require('util');
const UserModel = require('../models/user');
const SocialLoginModel = require('../models/socialLogin');
const Social = require('./social');
const Constants = require('./constants');

const { inspect } = Util;
const validator = UserModel.validatorRules();

async function handler(providerName, request, _h) {
  request.log(
    ['info', `${providerName}.connect`],
    `payload:: ${inspect(request.payload)}`,
  );

  const provider = new Social(providerName);
  let profile;
  try {
    profile = await provider.getProfile(request.payload.accessToken);
  } catch (e) {
    request.log(
      ['error', `${providerName}.connect`],
      `fetch profile${e.stack}`,
    );
    throw Boom.badRequest('Invalid social credentials');
  }

  request.log(
    ['info', `${providerName}.connect`],
    ` prfile response:  ${inspect(profile)}`,
  );

  const socialLogin = await SocialLoginModel.findOne(
    SocialLoginModel.buildCriteriaWithObject({
      provider: providerName,
      providerId: profile.id,
    }),
    {
      columns: '*,user.*',
    },
  );

  // Update the existing socialLogin details
  const socialObject = {
    id: socialLogin ? socialLogin.id : null,
    userId: request.params.userId,
    provider: providerName,
    providerId: profile.id,
    accessToken: request.payload.accessToken,
    rawBody: request.payload.rawBody,
    refreshToken: request.payload.refreshToken,
  };

  await SocialLoginModel.createOrUpdate(socialObject, false);
  return Constants.SUCCESS_RESPONSE;
}

module.exports = function socialSignUp(providerName) {
  const options = {
    auth: Constants.AUTH.ALL,
    description: `User Social Connect ${providerName} - Access - ALL`,
    tags: ['api'],
    validate: {
      params: Joi.object({
        userId: validator.id.required(),
      }),
      payload: Joi.object({
        accessToken: validator.accessToken.required(),
        refreshToken: validator.refreshToken.required(),
      }),
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [200]),
      },
    },
    handler: async (request, h) => await handler(providerName, request, h),
  };

  return () => ({
    method: ['POST'],
    path: `/api/users/{userId}/${providerName}/connect`,
    options,
  });
};
