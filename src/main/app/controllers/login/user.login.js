import Util from 'util';
import Boom from 'boom';
import _ from 'lodash';
import UserModel from '../../models/user';
import Constants from '../../commons/constants';

const validator = UserModel.validatorRules();
const inspect = Util.inspect;

const options = {
  auth: Constants.AUTH.ALL,
  description: 'Login User - Access - ALL',
  tags: ['api'],
  validate: {
    payload: {
      email: validator.email.required(),
      password: validator.password.required()
    }
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201, 403])
    }
  },
  handler: async(request, reply) => {
    request.log(['info', __filename], `payload:: ${inspect(request.payload)}`);

    let user = await UserModel.findOne(
      UserModel.buildCriteria('email', _.toLower(request.payload.email))
    );
    if (!user) {
      return reply(Boom.notFound('User doesnot exists'));
    }

    if (user.verifyPassword(request.payload.password)) {
      // on successful, create login_token for this user.
      user = await UserModel.signSession(request, user.id);
      return reply(user);
    }

    return reply(Boom.unauthorized('Invalid credentials.'));
  }
};

// eslint-disable-next-line no-unused-vars
const handler = (server) => {
  const details = {
    method: ['POST'],
    path: '/api/users/login',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
