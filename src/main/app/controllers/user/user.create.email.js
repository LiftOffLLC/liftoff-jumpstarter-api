const Util = require('util');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const Uuid = require('node-uuid');
const UserModel = require('../../models/user');
const UserRoleEnum = require('../../models/userRole').loginRoles();
const RedisClient = require('../../commons/redisClient');
const errorCodes = require('../../commons/errors');
const Constants = require('../../commons/constants');
const Utils = require('../../commons/utils');
const Config = require('../../../config');

const validator = UserModel.validatorRules();
const options = {
  auth: Constants.AUTH.ALL,
  description: 'Create User - Access - ALL',
  tags: ['api'],
  validate: {
    payload: Joi.object({
      name: validator.name.required(),
      password: validator.password.required(),
      email: validator.email.required(),
      avatarUrl: validator.avatarUrl.optional(),
      phoneNumber: validator.phoneNumber.optional(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [200]),
    },
  },
  handler: async (request, h) => {
    const user = await UserModel.findOne([
      UserModel.buildCriteria('email', request.payload.email),
      UserModel.buildCriteria('isActive', [true, false], 'in'),
    ]);

    // Error out if email already exists.
    if (!_.isEmpty(user)) {
      const errorCode = user.isActive
        ? errorCodes.emailDuplicate
        : errorCodes.userDisabled;
      throw Boom.forbidden(Util.format(errorCode, request.payload.email));
    }

    const userObject = _.clone(request.payload);
    userObject.hashedPassword = request.payload.password;
    delete userObject.password;
    const result = await UserModel.createOrUpdate(userObject);

    // on successful, create login_token for this user.
    const sessionId = Uuid.v4();
    const session = await request.server.asyncMethods.sessionsAdd(sessionId, {
      id: sessionId,
      userId: result.id,
      isAdmin: result.roleId === 1,
    });

    await RedisClient.saveSession(result.id, sessionId, session);
    // sign the token
    result.sessionToken = request.server.methods.sessionsSign(session);

    // allow entity filtering to happen here.
    _.set(request, 'auth.credentials.userId', result.id);
    _.set(
      request,
      'auth.credentials.scope',
      result.roleId === 1 ? UserRoleEnum.ADMIN : UserRoleEnum.USER,
    );

    const mailVariables = {
      webUrl: Config.get('webUrl'),
    };
    await Utils.addMailToQueue('welcome-msg', {}, result.id, {}, mailVariables);

    const response = h.response(result);
    response.code(201);
    return response;
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['POST'],
    path: '/api/users',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
