import Boom from '@hapi/boom';
import _ from 'lodash';
import Util from 'util';
import UserModel from '../models/user';
import SocialLoginModel from '../models/socialLogin';
import Social from './social';
import Constants from './constants';

const inspect = Util.inspect;
const validator = UserModel.validatorRules();

async function handler(providerName, request, h) {
  request.log(
    ['info', `${providerName}.connect`],
    `payload:: ${inspect(request.payload)}`,
  );

  const provider = new Social(providerName);
  let profile;
  try {
    profile = await provider.getProfile(request.payload.accessToken);
  } catch (e) {
    request.log(
      ['error', `${providerName}.connect`],
      `fetch profile${e.stack}`,
    );
    throw Boom.badRequest('Invalid social credentials');
  }

  request.log(
    ['info', `${providerName}.connect`],
    ` prfile response:  ${inspect(profile)}`,
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

  // Update the existing socialLogin details
  const socialObject = {
    id: socialLogin ? socialLogin.id : null,
    userId: request.params.userId,
    provider: providerName,
    providerId: profile.id,
    accessToken: request.payload.accessToken,
    rawBody: request.payload.rawBody,
    refreshToken: request.payload.refreshToken,
  };

  await SocialLoginModel.createOrUpdate(socialObject, false);
  return Constants.SUCCESS_RESPONSE;
}

export default function socialSignUp(providerName) {
  const options = {
    auth: Constants.AUTH.ALL,
    description: `User Social Connect ${providerName} - Access - ALL`,
    tags: ['api'],
    validate: {
      payload: {
        accessToken: validator.accessToken.required(),
        refreshToken: validator.refreshToken.required(),
      },
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [200]),
      },
    },
    handler: async (request, h) => await handler(providerName, request, h),
  };

  return () => ({
    method: ['POST'],
    path: `/api/users/{userId}/${providerName}/connect`,
    options,
  });
}
