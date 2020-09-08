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
        const UserScope = UserModel.scope();
        const UserRole = UserModel.role();
        const user = await UserModel.findOne(
          UserModel.buildCriteria('id', session.subject.userId),
          {
            columns: 'id,role',
          },
        );

        if (user) {
          // eslint-disable-next-line
          session.subject.scope =
            (user.role === UserRole.ADMIN) === true
              ? UserScope.ADMIN
              : UserScope.USER;

          session.subject.role = user.role;
        } else {
          session.subject.scope = UserScope.GUEST;
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
