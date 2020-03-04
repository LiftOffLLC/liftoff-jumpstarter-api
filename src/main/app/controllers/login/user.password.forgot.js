const Util = require('util');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const JWT = require('jsonwebtoken');
const Uuid = require('node-uuid');
const UserModel = require('../../models/user');
const Config = require('../../../config');
const Constants = require('../../commons/constants');
const Utils = require('../../commons/utils');

const validator = UserModel.validatorRules();
const { inspect } = Util;
const options = {
  auth: Constants.AUTH.ALL,
  description: 'Request for password reset - Access - ALL',
  tags: ['api'],
  validate: {
    query: Joi.object({
      email: validator.email.required(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201]),
    },
  },
  handler: async (request, _h) => {
    request.log(['info', __filename], `query:: ${inspect(request.query)}`);

    // Fetch user with provided email
    const user = await UserModel.findOne(
      UserModel.buildCriteria('email', request.query.email),
    );
    if (!user) {
      throw Boom.notFound('User Not Found');
    }

    // Generate random id
    const tokenId = Uuid.v4();
    request.log(['info', __filename], `token id - ${tokenId}`);

    // Create JWT string for tokenId
    const tokenSecretkey = Config.get('passwordReset').get('tokenSecretkey');
    const tokenString = JWT.sign(
      {
        email: user.email,
        tokenId,
      },
      tokenSecretkey,
    );

    // Construct web app url for email redirection
    const redirectUrl = Config.get('passwordReset').get('forgotUrl');
    request.log(['info', __filename], `redirectUrl - ${redirectUrl}`);

    const redirect = `${redirectUrl}?auth=${tokenString}`;
    const mailVariables = {
      forgotPasswordURL: redirect,
      tokenString,
    };

    await Utils.addMailToQueue(
      'password-reset',
      {},
      user.id,
      {},
      mailVariables,
    );

    // Update table with tokenId and time
    user.resetPasswordSentAt = new Date();
    user.resetPasswordToken = tokenId;
    const updatedUser = await UserModel.createOrUpdate(user);
    request.log(
      ['info', __filename],
      `updated response - ${inspect(updatedUser)}`,
    );
    throw Constants.SUCCESS_RESPONSE;
  },
};

const handler = () => {
  const details = {
    method: ['GET'],
    path: '/api/users/forgot_password',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
