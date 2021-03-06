const _ = require('lodash');
const Constants = require('../../commons/constants');

const options = {
  auth: Constants.AUTH.ADMIN_OR_USER,
  description: 'Get Current User - Access - admin,user',
  tags: ['api'],
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201, 403]),
    },
  },
  handler: async (request, _h) => request.auth.credentials.user,
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['GET'],
    path: '/api/users/me',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
