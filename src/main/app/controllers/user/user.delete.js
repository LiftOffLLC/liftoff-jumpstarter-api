const _ = require('lodash');
const Util = require('util');
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const UserModel = require('../../models/user');
const UserRole = UserModel.role();
const errorCodes = require('../../commons/errors');
const Constants = require('../../commons/constants');
const validator = UserModel.validatorRules();

const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Delete User - Access - Admin',
  tags: ['api'],
  validate: {
    query: Joi.object({
      userId: validator.id.required(),
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
  handler: async (request, _h) => {
    const userId = _.get(request, 'query.userId');
    const filters = [
      UserModel.buildCriteria('id', userId),
      UserModel.buildCriteria('isActive', [true, false], 'in'),
    ];
    const user = await UserModel.findOne(filters);
    if (!user) {
      throw Boom.notFound(Util.format(errorCodes.userNotFound, userId));
    } else if (user.role === UserRole.ADMIN) {
      throw Boom.forbidden('Cannot delete admin!');
    }

    try {
      await UserModel.deleteAll(filters, request.query.hardDeleteFlag);
      return Constants.SUCCESS_RESPONSE;
    } catch (err) {
      throw Boom.internal(err);
    }
  },
};

const handler = _server => {
  const details = {
    method: ['DELETE'],
    path: '/api/users',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
