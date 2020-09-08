const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const UserModel = require('../../models/user');
const Constants = require('../../commons/constants');
const UserScope = UserModel.scope();
const validator = UserModel.validatorRules();

const options = {
  auth: Constants.AUTH.ADMIN_OR_USER,
  description: 'Update User - Access - admin,user',
  tags: ['api'],
  validate: {
    payload: Joi.object({
      userId: validator.id.optional(),
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
  },
  handler: async (request, _h) => {
    const authScopeUserId = _.get(request, 'auth.credentials.userId');
    const userId = _.get(request, 'payload.userId');
    const isUserIdDefined = !_.isUndefined(userId);
    const isAdmin =
      _.get(request, 'auth.credentials.scope') === UserScope.ADMIN;

    if (!isAdmin && isUserIdDefined) {
      throw Boom.badRequest();
    }

    const payload = _.cloneDeep(request.payload);
    if (isUserIdDefined) {
      payload.id = payload.userId;
      delete payload.userId;
    } else {
      payload.id = authScopeUserId;
    }

    // Update password.
    if (payload.oldPassword || payload.password) {
      const user = await UserModel.findOne(
        UserModel.buildCriteria('id', payload.id),
      );

      if (
        payload.oldPassword &&
        payload.password &&
        user.verifyPassword(payload.oldPassword)
      ) {
        payload.hashedPassword = payload.password;
        // TODO: Send back Fresh tokens for login. Ideally we should log out this guy.
      } else {
        throw Boom.unauthorized('Invalid Credentials.');
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
    path: '/api/users',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
