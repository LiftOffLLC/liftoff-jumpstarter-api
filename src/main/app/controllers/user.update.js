import Boom from 'boom';
import _ from 'lodash';
import UserModel from '../models/user';
import checkIfExists from '../policies/checkIfExists';
import isAuthorized from '../policies/isAuthorized';
import Constants from '../commons/constants';

const validator = UserModel.validatorRules();

const options = {
  auth: Constants.AUTH.ADMIN_OR_USER,
  description: 'Update User - Access - admin,user',
  tags: ['api'],
  validate: {
    params: {
      userId: validator.userId.required()
    },
    payload: {
      name: validator.name.optional(),
      phoneNumber: validator.phoneNumber.optional(),
      avatarUrl: validator.avatarUrl.optional(),
      oldPassword: validator.password.optional(),
      password: validator.password.optional()
    }
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201])
    },
    policies: [
      isAuthorized('params.userId'),
      checkIfExists(UserModel, 'User', ['id'], ['params.userId'])
    ]
  },
  handler: async(request, reply) => {
    const payload = _.cloneDeep(request.payload);
    payload.id = request.params.userId;

    // Update password.
    if (payload.oldPassword || payload.password) {
      const user = await UserModel.findOne(UserModel.buildCriteria('id', payload.id));

      if (user.verifyPassword(payload.oldPassword || '')) {
        if (payload.password) {
          payload.encryptedPassword = payload.password;
          // TODO: Send back Fresh tokens for login. Ideally we should log out this guy.
        } else {
          return reply(Boom.unauthorized('Invalid credentials.'));
        }
      } else {
        return reply(Boom.unauthorized('Invalid credentials.'));
      }
    }

    delete payload.oldPassword;
    delete payload.password;
    const result = await UserModel.createOrUpdate(payload);
    return reply(result);
  }
};

// eslint-disable-next-line no-unused-vars
const handler = (server) => {
  const details = {
    method: ['PUT'],
    path: '/api/users/{userId}',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
