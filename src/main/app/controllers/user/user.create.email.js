const Util = require('util');
const Boom = require('@hapi/boom');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const uuid = require('uuid');
const UserModel = require('../../models/user');
const RedisClient = require('../../commons/redisClient');
const errorCodes = require('../../commons/errors');
const Constants = require('../../commons/constants');
const Utils = require('../../commons/utils');
const Config = require('../../../config');
const UserScope = UserModel.scope();
const UserRole = UserModel.role();
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
    const userWithEmail = await UserModel.findOne([
      UserModel.buildCriteria('email', request.payload.email),
      UserModel.buildCriteria('isActive', [true, false], 'in'),
    ]);

    // Error out if email already exists.
    if (!_.isEmpty(userWithEmail)) {
      const errorCode = userWithEmail.isActive
        ? errorCodes.emailDuplicate
        : errorCodes.userDisabled;
      throw Boom.forbidden(Util.format(errorCode, request.payload.email));
    }

    const user = _.clone(request.payload);
    user.hashedPassword = request.payload.password;
    delete user.password;

    user.role = UserRole.USER;

    const resultUser = await UserModel.createOrUpdate(user);

    // on successful, create login_token for this user.
    const sessionId = uuid.v4();
    const session = await request.server.asyncMethods.sessionsAdd(sessionId, {
      id: sessionId,
      userId: resultUser.id,
      isAdmin: resultUser.role === UserRole.ADMIN,
    });

    await RedisClient.saveSession(resultUser.id, sessionId, session);
    // sign the token
    resultUser.sessionToken = request.server.methods.sessionsSign(session);

    // allow entity filtering to happen here.
    _.set(request, 'auth.credentials.userId', resultUser.id);
    _.set(
      request,
      'auth.credentials.scope',
      resultUser.role === UserRole.ADMIN ? UserScope.ADMIN : UserScope.USER,
    );

    const mailVariables = {
      webUrl: Config.get('webUrl'),
    };
    await Utils.addMailToQueue(
      'welcome-msg',
      {},
      resultUser.id,
      {},
      mailVariables,
    );

    const response = h.response(resultUser);
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
