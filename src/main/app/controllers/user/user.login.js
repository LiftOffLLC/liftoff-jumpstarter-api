const Util = require('util');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const UserModel = require('../../models/user');
const Constants = require('../../commons/constants');

const validator = UserModel.validatorRules();
const { inspect } = Util;

const options = {
  auth: Constants.AUTH.ALL,
  description: 'Login User - Access - ALL',
  tags: ['api'],
  validate: {
    payload: Joi.object({
      email: validator.email.required(),
      password: validator.password.required(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201, 403]),
    },
  },
  handler: async (request, _h) => {
    request.log(['info', __filename], `payload:: ${inspect(request.payload)}`);

    let user = await UserModel.findOne(
      UserModel.buildCriteria('email', _.toLower(request.payload.email)),
    );

    if (!user) {
      throw Boom.notFound('User does not exists');
    }

    if (user.verifyPassword(request.payload.password)) {
      // on successful, create login_token for this user.
      user = await UserModel.signSession(request, user.id);
      return user;
    }

    throw Boom.unauthorized('Invalid credentials.');
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['POST'],
    path: '/api/users/login',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
