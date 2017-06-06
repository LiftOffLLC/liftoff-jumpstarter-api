import Boom from 'boom';
import {
  inspect
} from 'util';
import UserModel from '../models/user';
import SocialLoginModel from '../models/socialLogin';
import Social from './social';
import Constants from './constants';

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

  const user = await UserModel.signSession(request, socialLogin.userId);
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
