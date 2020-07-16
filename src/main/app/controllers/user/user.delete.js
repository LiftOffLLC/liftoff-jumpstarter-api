const _ = require('lodash');
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const UserModel = require('../../models/user');
const checkIfExists = require('../../policies/checkIfExists');
const Constants = require('../../commons/constants');
const validator = UserModel.validatorRules();

const deleteUserHandler = async (request, _h) => {
  const { userId } = _.get(request, 'params');
  try {
    await UserModel.deleteAll(UserModel.buildCriteria('id', userId), false);
    return { success: true };
  } catch (err) {
    throw Boom.badRequest(err);
  }
};

const handler = _server => {
  const details = {
    method: ['DELETE'],
    path: '/api/users/{userId}',
    options: {
      auth: Constants.AUTH.ADMIN_ONLY,
      description: 'Delete User - Access - Admin',
      tags: ['api'],
      validate: {
        params: Joi.object({
          userId: validator.id.required(),
        }),
      },
      plugins: {
        'hapi-swagger': {
          responses: _.omit(Constants.API_STATUS_CODES, [200]),
        },
        policies: [checkIfExists(UserModel, 'User', ['id'], ['params.userId'])],
      },
      handler: deleteUserHandler,
    },
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
