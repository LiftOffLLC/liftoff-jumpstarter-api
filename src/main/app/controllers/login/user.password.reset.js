const Util = require('util');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const UserModel = require('../../models/user');
const Config = require('../../../config');
const Constants = require('../../commons/constants');

const { inspect } = Util;
const validator = UserModel.validatorRules();
const options = {
  auth: Constants.AUTH.ALL,
  description: 'Reset password  - Access - ALL',
  tags: ['api'],
  validate: {
    payload: Joi.object({
      email: validator.email.required(),
      password: validator.password.required(),
      resetPasswordToken: validator.resetPasswordToken.required(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201]),
    },
  },
  handler: async (request, _h) => {
    request.log(['info', __filename], `payload:: ${inspect(request.payload)}`);

    // Fetch user with provided email
    const user = await UserModel.findOne(
      UserModel.buildCriteria('email', request.payload.email),
    );
    if (!user) {
      throw Boom.notFound('User Not Found');
    }
    request.log(['info', __filename], `user found - ${inspect(user)}`);

    // Validate token
    if (request.payload.resetPasswordToken !== user.resetPasswordToken) {
      throw Boom.badRequest('Invalid Token');
    }

    if (
      +new Date(request.payload.resetPasswordSentAt) - +new Date() >
      Config.get('passwordReset').get('duration')
    ) {
      throw Boom.badRequest('Token Expired');
    }

    // Reset token and create hash from password
    user.resetPasswordSentAt = null;
    user.resetPasswordToken = null;
    user.encryptedPassword = request.payload.password;
    const updatedUser = await UserModel.createOrUpdate(user);

    request.log(
      ['info', __filename],
      `updated response - ${inspect(updatedUser)}`,
    );
    return updatedUser;
  },
};

const handler = () => {
  const details = {
    method: ['POST'],
    path: '/api/users/reset_password',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
