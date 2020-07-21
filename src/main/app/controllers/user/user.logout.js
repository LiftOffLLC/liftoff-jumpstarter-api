const Util = require('util');
const _ = require('lodash');
const JWT = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const Logger = require('../../commons/logger');
const UserModel = require('../../models/user');
const errorCodes = require('../../commons/errors');
const Config = require('../../../config');
const RedisClient = require('../../commons/redisClient');
const Constants = require('../../commons/constants');
const UserRoleEnum = require('../../models/userRole').loginRoles();

const validator = UserModel.validatorRules();
const { inspect } = Util;

const options = {
  auth: Constants.AUTH.ADMIN_OR_USER,
  description: 'Logout User - Access - admin,user',
  tags: ['api'],
  validate: {
    query: Joi.object({
      userId: validator.id.optional(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201]),
    },
  },
  handler: async (request, _h) => {
    request.log(
      ['info', __filename],
      `userId:: ${inspect(request.query.userId)}`,
      `authScopeUserId:: ${inspect(request.auth.credentials.userId)}`,
    );

    const authScopeUserId = _.get(request, 'auth.credentials.userId');
    const userId = _.get(request, 'query.userId');
    const isUserIdDefined = !_.isUndefined(userId);
    const isAdmin =
      _.get(request, 'auth.credentials.scope') === UserRoleEnum.ADMIN;
    const isSelf = authScopeUserId == userId; // eslint-disable-line eqeqeq

    if (!isAdmin && isUserIdDefined && !isSelf) {
      throw Boom.forbidden(errorCodes.unableToLogoutOtherUser);
    }

    /**
    Admin should be able to knock-out a particular users sessions
    If user Is admin and is trying to logout other user.
    ---------------------------------------------
    userRole  adminUserId userId  session_to_delete
    ---------------------------------------------
    ADMIN      1             1       sessions:1:"token"
    ADMIN      1             2       sessions:2:*
    USER       2             2       sessions:2:"token"
    USER       2             1       forbidden (403)
    ---------------------------------------------
    */

    let sessionId;
    let logoutUserId;
    if (isAdmin && isUserIdDefined && !isSelf) {
      sessionId = '';
      logoutUserId = userId;
    } else {
      const decoded = JWT.decode(
        request.headers.authorization,
        Config.get('auth').get('key'),
      );
      sessionId = decoded.id;
      logoutUserId = authScopeUserId;
    }
    Logger.info('logout :: deleting sessionId :: ', sessionId);
    await RedisClient.deleteSession(logoutUserId, sessionId);

    return Constants.SUCCESS_RESPONSE;
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['DELETE'],
    path: '/api/users/logout',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
