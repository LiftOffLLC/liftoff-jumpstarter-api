import Boom from 'boom';
import Uuid from 'node-uuid';
import _ from 'lodash';
import {
  inspect
} from 'util';
import UserModel from '../models/user';
import SocialLoginModel from '../models/socialLogin';
import RedisClient from './redisClient';
import Social from './social';
import Constants from './constants';
import UserRole from '../models/userRole';

const validator = UserModel.validatorRules();

async function handler(providerName, request, reply) {
  request.log(['info', `user.login.${providerName}`], `payload:: ${inspect(request.payload)}`);

  const provider = new Social(providerName);
  let profile;
  try {
    profile = await provider.getProfile(request.payload.accessToken);
  } catch (e) {
    request.log(['error', `user.login.${providerName}`], `fetch profile${e.stack}`);
    return reply(Boom.unauthorized('Invalid social credentials'));
  }

  const socialLogin = await SocialLoginModel.findOne(
    SocialLoginModel.buildCriteriaWithObject({
      provider: providerName,
      providerId: profile.id
    }));

  if (!socialLogin) {
    throw reply(Boom.notFound(`${providerName} not registered, Try Signup.`));
  }

  const user = await UserModel.findOne(
    UserModel.buildCriteria('id', socialLogin.userId), {
      columns: '*,socialLogins.*'
    }
  );

  request.log(['info', 'user.login'], `user found - ${inspect(user)}`);
  const sessionId = Uuid.v4();
  const session = await request.server.asyncMethods.sessionsAdd(sessionId, {
    id: sessionId,
    userId: user.id,
    isAdmin: user.isAdmin
  });
  await RedisClient.saveSession(user.id, sessionId, session);
  user.sessionToken = request.server.methods.sessionsSign(session);

  // allow entity filtering to happen here.
  _.set(request, 'auth.credentials.userId', user.id);
  _.set(request, 'auth.credentials.scope', user.isAdmin ? UserRole.ADMIN : UserRole.USER);

  // HAck to send back the social access/refresh token to self
  for (const socialLog of user.socialLogins) {
    _.set(socialLog, '_accessToken', socialLog.accessToken);
    _.set(socialLog, '_refreshToken', socialLog.refreshToken);
  }
  return reply(user);
}

export default function socialLoginFn(providerName) {
  const options = {
    auth: Constants.AUTH.ALL,
    description: `Login ${providerName} - Access - ALL`,
    tags: ['api'],
    validate: {
      payload: {
        accessToken: validator.accessToken.required(),
        refreshToken: validator.refreshToken.required()
      }
    },
    plugins: {
      'hapi-swagger': {
        responses: {
          200: {
            description: 'Logged in successfully'
          },
          400: {
            description: 'Malformed request, Check accessToken or refreshToken provided'
          },
          401: {
            description: `Invalid social credentials. Got error while fetching profile from ${providerName}. Check social credentials are not expired`
          },
          404: {
            description: `No user found for given ${providerName} details, Try Signup.`
          },
          500: {
            description: 'The server encountered an unexpected condition which prevented it from fulfilling the request.'
          }
        }
      }
    },
    handler: async(request, reply) => await handler(providerName, request, reply)
  };

  return () => ({
    method: ['POST'],
    path: `/api/users/login/${providerName}`,
    config: options
  });
}
