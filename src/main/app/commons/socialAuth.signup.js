const Boom = require('@hapi/boom');
const uuid = require('uuid');
const Joi = require('@hapi/joi');

const Util = require('util');
const UserModel = require('../models/user');
const SocialLoginModel = require('../models/social-login');
const Social = require('./social');
const errorCodes = require('./errors');
const Constants = require('./constants');
const Utils = require('./utils');
const UserRole = UserModel.role();
const Config = require('../../config');

const validator = UserModel.validatorRules();
const { inspect } = Util;

async function handler(providerName, request, h) {
  request.log(
    ['info', `${providerName}.signup`],
    `payload:: ${inspect(request.payload)}`,
  );

  const provider = new Social(providerName);
  let profile;
  try {
    profile = await provider.getProfile(request.payload.accessToken);
  } catch (e) {
    request.log(['error', `${providerName}.signup`], `fetch profile${e.stack}`);
    throw Boom.badRequest('Invalid Social Credentials.');
  }

  request.log(
    ['info', `${providerName}.signup`],
    ` profile response:  ${inspect(profile)}`,
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

  // Is already registered with social login, error out.
  if (profile && socialLogin) {
    throw Boom.forbidden(Util.format(errorCodes.socialDuplicate, providerName));
  }

  let user;
  const usersRegisteredUsingEmail = await UserModel.findOne(
    UserModel.buildCriteria('email', request.payload.email.toLowerCase()),
  );

  if (usersRegisteredUsingEmail) {
    user = usersRegisteredUsingEmail;
  } else {
    const userObject = {
      email: request.payload.email,
      name: request.payload.name,
      phoneNumber: request.payload.phoneNumber,
      hashedPassword: uuid.v4(),
      avatarUrl: request.payload.avatarUrl,
      subscribedToNewsletter: request.payload.subscribedToNewsletter,
      role: UserRole.USER,
    };
    try {
      user = await UserModel.createOrUpdate(userObject);
    } catch (e) {
      request.log(['error', `${providerName}.signup`], e);
      throw Boom.forbidden(e.message, request.payload.email);
    }
  }

  try {
    const socialObject = {
      userId: user.id,
      provider: providerName,
      providerId: profile.id,
      accessToken: request.payload.accessToken,
      refreshToken: request.payload.refreshToken,
      rawBody: request.payload.rawBody,
      isPrimaryLogin: true,
    };

    await SocialLoginModel.createOrUpdate(socialObject);
  } catch (e) {
    request.log(['error', `${providerName}.signup`], e);
    throw Boom.forbidden(e.message, request.payload.email);
  }

  const mailVariables = {
    webUrl: Config.get('webUrl'),
  };
  await Utils.addMailToQueue('welcome-msg', {}, user.id, {}, mailVariables);
  // on successful, create login_token for this user.
  user = await UserModel.signSession(request, user.id);

  const response = h.response(user);
  response.code(201);
  return response;
}

module.exports = function socialSignUp(providerName) {
  const options = {
    auth: Constants.AUTH.ALL,
    description: `User create ${providerName} - Access - ALL`,
    tags: ['api'],
    validate: {
      payload: Joi.object({
        name: validator.name.required(),
        email: validator.email.required(),
        accessToken: validator.accessToken.required(),
        refreshToken: validator.refreshToken.required(),
        phoneNumber: validator.phoneNumber.optional(),
        avatarUrl: validator.avatarUrl.optional(),
        rawBody: validator.rawBody.optional(),
      }),
    },
    plugins: {
      'hapi-swagger': {
        responses: {
          201: {
            description: 'Created user successfully.',
          },
          400: {
            description:
              'Malformed request, check email,userName,accessToken and refreshToken are provided.',
          },
          403: {
            description: `Could not signup user because some of the fields (email or username, ${providerName}) already be added.`,
          },
          500: {
            description:
              'The server encountered an unexpected condition which prevented it from fulfilling the request.',
          },
        },
      },
    },
    handler: async (request, h) => await handler(providerName, request, h),
  };

  return () => ({
    method: ['POST'],
    path: `/api/users/signup/${providerName}`,
    options,
  });
};
