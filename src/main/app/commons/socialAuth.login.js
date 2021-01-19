const Boom = require('@hapi/boom');

const { inspect } = require('util');
const UserModel = require('../models/user');
const SocialLoginModel = require('../models/social-login');
const Constants = require('./constants');

async function handler(providerName, request, _h) {
  request.log(
    ['info', `user.login.${providerName}`],
    `payload:: ${inspect(request.payload)}`,
  );

  if (!request.auth.isAuthenticated) {
    throw Boom.forbidden(
      `Authentication failed due to: ${request.auth.error.message}`,
    );
  }

  const { credentials } = request.auth;
  const { profile } = credentials;

  const socialLogin = await SocialLoginModel.findOne(
    SocialLoginModel.buildCriteriaWithObject({
      provider: providerName,
      providerId: profile.id,
    }),
  );

  let userId;
  if (!socialLogin) {
    const emailUser = await UserModel.findOne(
      UserModel.buildCriteria('email', profile.email.toLowerCase()),
    );
    if (emailUser) {
      // if user exists create socialLogin else throw error
      try {
        const socialObject = {
          userId: emailUser.id,
          provider: providerName,
          providerId: profile.id,
          accessToken: credentials.token,
          refreshToken: null,
          isPrimaryLogin: true,
        };

        await SocialLoginModel.createOrUpdate(socialObject);
      } catch (e) {
        request.log(['error', `${providerName}.login`], e);
        throw Boom.forbidden(e.message, profile.email);
      }
      userId = emailUser.id;
    } else {
      throw Boom.notFound(`${providerName} not registered, Try Signup.`);
    }
  } else {
    userId = socialLogin.userId;
  }

  const user = await UserModel.signSession(request, userId);
  return user;
}

module.exports = function socialLoginFn(providerName) {
  const options = {
    auth: Constants.AUTH[providerName.toUpperCase()],
    description: `Login ${providerName} - Access - ALL`,
    tags: ['api'],
    plugins: {
      'hapi-swagger': {
        responses: {
          200: {
            description: 'Logged in successfully',
          },
          400: {
            description:
              'Malformed request, Check accessToken or refreshToken provided',
          },
          401: {
            description: `Invalid Social Credentials. Got error while fetching profile from ${providerName}. Check social credentials are not expired`,
          },
          404: {
            description: `No user found for given ${providerName} details, Try Signup.`,
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
    method: ['GET', 'POST'],
    path: `/api/users/login/${providerName}`,
    options,
  });
};
