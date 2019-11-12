import Logger from '../commons/logger';
import UserRoles from '../models/userRole';

export default {
  // validate decoded token
  validateToken: async (decoded, request) => {
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

        const user = await UserModel.findOne(
          UserModel.buildCriteria('id', session.subject.userId),
          {
            columns: 'id,isAdmin',
          },
        );

        if (user) {
          // eslint-disable-next-line eqeqeq
          session.subject.scope =
            user.isAdmin == true ? UserRoles.ADMIN : UserRoles.USER;
        } else {
          session.subject.scope = UserRoles.GUEST;
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
      } else {
        Logger.error('validateToken err :: Invalid token found.');
        // next(null, false);
        return {
          isValid: false,
        };
      }
    } catch (err) {
      Logger.error('validateToken err :: Junk token found.');
      // next(null, false);
      return {
        isValid: false,
      };
    }
  },
};
