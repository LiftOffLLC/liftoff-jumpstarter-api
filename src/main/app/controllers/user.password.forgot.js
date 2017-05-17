import Util from 'util';
import Boom from 'boom';
import _ from 'lodash';
import JWT from 'jsonwebtoken';
import Uuid from 'node-uuid';
import UserModel from '../models/user';
import Config from '../../config';
import Constants from '../commons/constants';
import addMailToQueue from '../commons/addMailToQueue';

const validator = UserModel.validatorRules();
const inspect = Util.inspect;
const options = {
  auth: Constants.AUTH.ALL,
  description: 'Request for password reset - Access - ALL',
  tags: ['api'],
  validate: {
    query: {
      email: validator.email.required()
    }
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201])
    }
  },
  handler: async(request, reply) => {
    request.log(['info', __filename], `query:: ${inspect(request.query)}`);

    // Fetch user with provided email
    const user = await UserModel.findOne(
      UserModel.buildCriteria('email', request.query.email)
    );
    if (!user) {
      return reply(Boom.notFound('User Not Found'));
    }

    // Generate random id
    const tokenId = Uuid.v4();
    request.log(['info', __filename], `token id - ${tokenId}`);

    // Create JWT string for tokenId
    const tokenSecretkey = Config.get('passwordReset').get('tokenSecretkey');
    const tokenString = JWT.sign({
      email: user.email,
      tokenId
    }, tokenSecretkey);

    // Construct web app url for email redirection
    const redirectUrl = Config.get('passwordReset').get('forgotUrl');
    request.log(['info', __filename], `redirectUrl - ${redirectUrl}`);

    const redirect = `${redirectUrl}?auth=${tokenString}`;
    const mailVariables = {
      forgotPasswordURL: redirect,
      tokenString
    };

    await addMailToQueue('password-reset', {}, user.id, {}, mailVariables);

    // Update table with tokenId and time
    user.resetPasswordSentAt = new Date();
    user.resetPasswordToken = tokenId;
    const updatedUser = await UserModel.createOrUpdate(user);
    request.log(['info', __filename], `updated response - ${inspect(updatedUser)}`);
    return reply(Constants.SUCCESS_RESPONSE);
  }
};

const handler = () => {
  const details = {
    method: ['GET'],
    path: '/api/users/forgot_password',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
