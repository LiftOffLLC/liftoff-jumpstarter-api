const Logger = require('./logger');

module.exports = {
  // validate decoded token
  validateToken: async (decoded, _request, _h) => {
    try {
      // the request.server.methods.session is to obtain cached session in server
      // NOTE:: since this is getting called from config,
      // refrain to loading redisClient dynamically
      // eslint-disable-next-line global-require
      const RedisClient = require('./redisClient');

      const session = await RedisClient.getSession(
        decoded.subject.userId,
        decoded.id,
      );

      Logger.info('validateToken : decoded : ', decoded);
      Logger.info('validateToken : session : ', session);

      // TODO: add checks for expiry..
      if (decoded.subject.userId === session.subject.userId) {
        // if the session exist, continue to next
        // eslint-disable-next-line global-require
        const UserModel = require('../models/user');
        // eslint-disable-next-line global-require
        const UserRoleEnum = require('../models/userRole').loginRoles();
        // eslint-disable-next-line global-require
        const Constants = require('./constants');

        const user = await UserModel.findOne(
          UserModel.buildCriteria('id', session.subject.userId),
          {
            columns: 'id,roleId',
          },
        );

        if (user) {
          // eslint-disable-next-line eqeqeq
          session.subject.scope =
            (user.roleId === Constants.ROLES.ADMIN) === true
              ? UserRoleEnum.ADMIN
              : UserRoleEnum.USER;

          session.subject.roleId = user.roleId;
        } else {
          session.subject.scope = UserRoleEnum.GUEST;
        }
        Logger.info(
          'validateToken : session.user.role :> ',
          session.subject.scope,
        );
        // next(null, true, session.subject);
        return {
          isValid: true,
          credentials: session.subject,
        };
      }
      Logger.error('validateToken err :: Invalid token found.');
      // next(null, false);
      return {
        isValid: false,
      };
    } catch (err) {
      Logger.error('validateToken err :: Junk token found.');
      // next(null, false);
      return {
        isValid: false,
      };
    }
  },
};
