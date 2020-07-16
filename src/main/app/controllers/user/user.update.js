const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const UserModel = require('../../models/user');
const checkIfExists = require('../../policies/checkIfExists');
const isAuthorized = require('../../policies/isAuthorized');
const Constants = require('../../commons/constants');

const validator = UserModel.validatorRules();

const options = {
  auth: Constants.AUTH.ADMIN_OR_USER,
  description: 'Update User - Access - admin,user',
  tags: ['api'],
  validate: {
    params: Joi.object({
      userId: validator.id.required(),
    }),
    payload: Joi.object({
      name: validator.name.optional(),
      phoneNumber: validator.phoneNumber.optional(),
      avatarUrl: validator.avatarUrl.optional(),
      oldPassword: validator.password.optional(),
      password: validator.password.optional(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201]),
    },
    policies: [
      isAuthorized('params.userId'),
      checkIfExists(UserModel, 'User', ['id'], ['params.userId']),
    ],
  },
  handler: async (request, _h) => {
    const payload = _.cloneDeep(request.payload);
    payload.id = request.params.userId;

    // Update password.
    if (payload.oldPassword || payload.password) {
      const user = await UserModel.findOne(
        UserModel.buildCriteria('id', payload.id),
      );

      if (user.verifyPassword(payload.oldPassword || '') && payload.password) {
        payload.encryptedPassword = payload.password;
        // TODO: Send back Fresh tokens for login. Ideally we should log out this guy.
      } else {
        throw Boom.unauthorized('Invalid credentials.');
      }
    }

    delete payload.oldPassword;
    delete payload.password;
    const result = await UserModel.createOrUpdate(payload);
    return result;
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['PUT'],
    path: '/api/users/{userId}',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
