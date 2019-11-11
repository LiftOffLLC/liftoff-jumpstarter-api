import Boom from '@hapi/boom';
import Uuid from 'node-uuid';
import Util, { inspect } from 'util';
import UserModel from '../models/user';
import SocialLoginModel from '../models/socialLogin';
import Social from './social';
import errorCodes from './errors';
import Constants from './constants';
import { addMailToQueue } from '../commons/utils';
import Config from '../../config';

const validator = UserModel.validatorRules();

async function handler(providerName, request, h) {
  request.log(
    ['info', `${providerName}.signup`],
    `payload:: ${inspect(request.payload)}`,
  );

  const provider = new Social(providerName);
  let profile;
  try {
    profile = await provider.getProfile(request.payload.accessToken);
  } catch (e) {
    request.log(['error', `${providerName}.signup`], `fetch profile${e.stack}`);
    throw Boom.badRequest('Invalid social credentials');
  }

  request.log(
    ['info', `${providerName}.signup`],
    ` profile response:  ${inspect(profile)}`,
  );

  const socialLogin = await SocialLoginModel.findOne(
    SocialLoginModel.buildCriteriaWithObject({
      provider: providerName,
      providerId: profile.id,
    }),
    {
      columns: '*,user.*',
    },
  );

  // Is already registered with social login, error out.
  if (profile && socialLogin) {
    throw Boom.forbidden(Util.format(errorCodes.socialDuplicate, providerName));
  }

  let user;
  const usersRegisteredUsingEmail = await UserModel.findOne(
    UserModel.buildCriteria('email', request.payload.email.toLowerCase()),
  );

  if (usersRegisteredUsingEmail) {
    user = usersRegisteredUsingEmail;
  } else {
    const userObject = {
      email: request.payload.email,
      name: request.payload.name,
      phoneNumber: request.payload.phoneNumber,
      encryptedPassword: Uuid.v4(),
      avatarUrl: request.payload.avatarUrl,
      subscribedToNewsletter: request.payload.subscribedToNewsletter,
    };
    try {
      user = await UserModel.createOrUpdate(userObject);
    } catch (e) {
      request.log(['error', `${providerName}.signup`], e);
      throw Boom.forbidden(e.message, request.payload.email);
    }
  }

  try {
    const socialObject = {
      userId: user.id,
      provider: providerName,
      providerId: profile.id,
      accessToken: request.payload.accessToken,
      refreshToken: request.payload.refreshToken,
      rawBody: request.payload.rawBody,
      isPrimaryLogin: true,
    };

    await SocialLoginModel.createOrUpdate(socialObject);
  } catch (e) {
    request.log(['error', `${providerName}.signup`], e);
    throw Boom.forbidden(e.message, request.payload.email);
  }

  const mailVariables = {
    webUrl: Config.get('webUrl'),
  };
  await addMailToQueue('welcome-msg', {}, user.id, {}, mailVariables);
  // on successful, create login_token for this user.
  user = await UserModel.signSession(request, user.id);

  const response = h.response(user);
  response.code(201);
  return response;
}

export default function socialSignUp(providerName) {
  const options = {
    auth: Constants.AUTH.ALL,
    description: `User create ${providerName} - Access - ALL`,
    tags: ['api'],
    validate: {
      payload: {
        name: validator.name.required(),
        email: validator.email.required(),
        accessToken: validator.accessToken.required(),
        refreshToken: validator.refreshToken.required(),
        phoneNumber: validator.phoneNumber.optional(),
        avatarUrl: validator.avatarUrl.optional(),
        rawBody: validator.rawBody.optional(),
      },
    },
    plugins: {
      'hapi-swagger': {
        responses: {
          201: {
            description: 'Created user successfully.',
          },
          400: {
            description:
              'Malformed request, check email,userName,accessToken and refreshToken are provided.',
          },
          403: {
            description: `Could not signup user because some of the fields (email or username, ${providerName}) already be added.`,
          },
          500: {
            description:
              'The server encountered an unexpected condition which prevented it from fulfilling the request.',
          },
        },
      },
    },
    handler: async (request, h) => await handler(providerName, request, h),
  };

  return () => ({
    method: ['POST'],
    path: `/api/users/signup/${providerName}`,
    options,
  });
}
