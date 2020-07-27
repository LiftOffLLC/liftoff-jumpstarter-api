const _ = require('lodash');
const Util = require('util');
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const UserModel = require('../../models/user');
const errorCodes = require('../../commons/errors');
const Constants = require('../../commons/constants');
const validator = UserModel.validatorRules();

const deleteUserHandler = async (request, _h) => {
  const { userId } = _.get(request, 'params');
  const filters = [
    UserModel.buildCriteria('id', userId),
    UserModel.buildCriteria('isActive', [true, false], 'in'),
  ];
  const user = await UserModel.findOne(filters);
  if (!user) {
    throw Boom.notFound(Util.format(errorCodes.userNotFound, userId));
  }

  try {
    await UserModel.deleteAll(filters, request.query.hardDeleteFlag);
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
        query: Joi.object({
          hardDeleteFlag: Joi.boolean()
            .default(false)
            .description('Hard delete flag')
            .optional(),
        }),
      },
      plugins: {
        'hapi-swagger': {
          responses: _.omit(Constants.API_STATUS_CODES, [200]),
        },
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
