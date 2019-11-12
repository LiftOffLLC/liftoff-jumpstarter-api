import _ from 'lodash';
import Joi from '@hapi/joi';

import UserModel from '../models/user';
import SocialLoginModel from '../models/socialLogin';
import isAuthorized from '../policies/isAuthorized';
import Constants from './constants';

const validator = UserModel.validatorRules();

export default function socialDisconnect(providerName) {
  const options = {
    auth: Constants.AUTH.ADMIN_OR_USER,
    description: `Disconnect ${providerName} - Access - ALL`,
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
      const criteria = SocialLoginModel.buildCriteriaWithObject({
        provider: providerName,
        userId: request.params.userId,
      });
      await SocialLoginModel.deleteAll(criteria, false);
      return Constants.SUCCESS_RESPONSE;
    },
  };

  return () => ({
    method: ['DELETE'],
    path: `/api/users/{userId}/${providerName}/disconnect`,
    options,
  });
}
