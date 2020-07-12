const Util = require('util');
const _ = require('lodash');
const JWT = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const Logger = require('../../commons/logger');
const UserModel = require('../../models/user');
const Config = require('../../../config');
const RedisClient = require('../../commons/redisClient');
const isAuthorized = require('../../policies/isAuthorized');
const Constants = require('../../commons/constants');
const UserRole = require('../../models/userRole');

const validator = UserModel.validatorRules();
const { inspect } = Util;

const options = {
  auth: Constants.AUTH.ADMIN_OR_USER,
  description: 'Logout User - Access - admin,user',
  tags: ['api'],
  validate: {
    params: Joi.object({
      userId: validator.userId.required(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201, 403]),
    },
    policies: [isAuthorized('params.userId')],
  },
  handler: async (request, _h) => {
    request.log(
      ['info', __filename],
      `userId:: ${inspect(request.params.userId)}`,
    );
    const decoded = JWT.decode(
      request.headers.authorization,
      Config.get('auth').get('key'),
    );
    const isAdmin = _.get(request, 'auth.credentials.scope') === UserRole.ADMIN;

    const authScopeUserId = _.get(request, 'auth.credentials.userId');
    const isSelf = authScopeUserId == request.params.userId; // eslint-disable-line eqeqeq

    /**
    Admin should be able to knock-out a particular users sessions
    If user Is admin and is trying to logout other user.
    ---------------------------------------------
    userRole  adminUserId userId  session_to_delete
    ---------------------------------------------
    ADMIN      1             1       sessions:1:"token"
    ADMIN      1             2       sessions:2:*
    USER       2             2       sessions:2:"token"
    USER       2             1       ***DEVELOPER BUG; EVER WONDER HOW HE MADE IT SO FAR***
    ---------------------------------------------
    */
    const sessionId = isAdmin && !isSelf ? '' : decoded.id;
    Logger.info('logout :: deleting sessionId :: ', sessionId);
    await RedisClient.deleteSession(request.params.userId, sessionId);

    return Constants.SUCCESS_RESPONSE;
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['DELETE'],
    path: '/api/users/{userId}/logout',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};