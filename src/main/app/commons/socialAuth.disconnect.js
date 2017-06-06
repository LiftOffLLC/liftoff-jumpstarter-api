import _ from 'lodash';
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
      params: {
        userId: validator.userId.required()
      }
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [201, 403])
      },
      policies: [
        isAuthorized('params.userId')
      ]
    },
    handler: async(request, reply) => {
      const criteria = SocialLoginModel.buildCriteriaWithObject({
        provider: providerName,
        userId: request.params.userId
      });
      await SocialLoginModel.deleteAll(criteria, false);
      return reply(Constants.SUCCESS_RESPONSE);
    }
  };

  return () => ({
    method: ['POST'],
    path: `/api/users/{userId}/${providerName}/disconnect`,
    config: options
  });
}
