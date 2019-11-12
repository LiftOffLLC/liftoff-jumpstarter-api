import Util from 'util';
import Boom from '@hapi/boom';
import Joi from '@hapi/joi';
import _ from 'lodash';
import UserModel from '../../models/user';
import Constants from '../../commons/constants';

const validator = UserModel.validatorRules();
const { inspect } = Util;

const options = {
  auth: Constants.AUTH.ALL,
  description: 'Login User - Access - ALL',
  tags: ['api'],
  validate: {
    payload: Joi.object({
      email: validator.email.required(),
      password: validator.password.required(),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201, 403]),
    },
  },
  handler: async (request, _h) => {
    request.log(['info', __filename], `payload:: ${inspect(request.payload)}`);

    let user = await UserModel.findOne(
      UserModel.buildCriteria('email', _.toLower(request.payload.email)),
    );

    if (!user) {
      throw Boom.notFound('User doesnot exists');
    }

    if (user.verifyPassword(request.payload.password)) {
      // on successful, create login_token for this user.
      user = await UserModel.signSession(request, user.id);
      return user;
    }

    throw Boom.unauthorized('Invalid credentials.');
  },
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['POST'],
    path: '/api/users/login',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
