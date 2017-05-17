import Util from 'util';
import Boom from 'boom';
import _ from 'lodash';
import UserModel from '../models/user';
import Config from '../../config';
import Constants from '../commons/constants';

const inspect = Util.inspect;
const validator = UserModel.validatorRules();
const options = {
  auth: Constants.AUTH.ALL,
  description: 'Reset password  - Access - ALL',
  tags: ['api'],
  validate: {
    payload: {
      email: validator.email.required(),
      password: validator.password.required(),
      resetPasswordToken: validator.resetPasswordToken.required()
    }
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201])
    }
  },
  handler: async(request, reply) => {
    request.log(['info', __filename], `payload:: ${inspect(request.payload)}`);

    // Fetch user with provided email
    const user = await UserModel.findOne(
      UserModel.buildCriteria('email', request.payload.email)
    );
    if (!user) {
      return reply(Boom.notFound('User Not Found'));
    }
    request.log(['info', __filename], `user found - ${inspect(user)}`);

    // Validate token
    if (request.payload.resetPasswordToken !== user.resetPasswordToken) {
      return reply(Boom.badRequest('Invalid Token'));
    }

    if (+new Date(request.payload.resetPasswordSentAt) - +new Date() > Config.get('passwordReset').get('duration')) {
      return reply(Boom.badRequest('Token Expired'));
    }

    // Reset token and create hash from password
    user.resetPasswordSentAt = null;
    user.resetPasswordToken = null;
    user.encryptedPassword = request.payload.password;
    const updatedUser = await UserModel.createOrUpdate(user);

    request.log(['info', __filename], `updated response - ${inspect(updatedUser)}`);
    return reply(updatedUser);
  }
};

const handler = () => {
  const details = {
    method: ['POST'],
    path: '/api/users/reset_password',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
