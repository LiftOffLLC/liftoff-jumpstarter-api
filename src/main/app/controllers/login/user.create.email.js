import Util from 'util';
import Boom from '@hapi/boom';
import Joi from '@hapi/joi';
import _ from 'lodash';
import Uuid from 'node-uuid';
import UserModel from '../../models/user';
import UserRole from '../../models/userRole';
import RedisClient from '../../commons/redisClient';
import errorCodes from '../../commons/errors';
import Constants from '../../commons/constants';
import Utils from '../../commons/utils';
import Config from '../../../config';

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
    const userCount = await UserModel.count(
      UserModel.buildCriteria('email', request.payload.email),
    );

    // Error out if email already exists.
    if (userCount > 0) {
      throw Boom.forbidden(
        Util.format(errorCodes.emailDuplicate, request.payload.email),
      );
    }

    const userObject = _.clone(request.payload);
    userObject.encryptedPassword = request.payload.password;
    delete userObject.password;
    const result = await UserModel.createOrUpdate(userObject);

    // on successful, create login_token for this user.
    const sessionId = Uuid.v4();
    const session = await request.server.asyncMethods.sessionsAdd(sessionId, {
      id: sessionId,
      userId: result.id,
      isAdmin: result.isAdmin,
    });

    await RedisClient.saveSession(result.id, sessionId, session);
    // sign the token
    result.sessionToken = request.server.methods.sessionsSign(session);

    // allow entity filtering to happen here.
    _.set(request, 'auth.credentials.userId', result.id);
    _.set(
      request,
      'auth.credentials.scope',
      result.isAdmin ? UserRole.ADMIN : UserRole.USER,
    );

    const mailVariables = {
      webUrl: Config.get('webUrl'),
    };
    await Utils.addMailToQueue('welcome-msg', {}, result.id, {}, mailVariables);

    const response = h.response(result);
    result.code(201);
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
