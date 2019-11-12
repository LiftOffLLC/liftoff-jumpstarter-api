import Constants from '../../commons/constants';

// eslint-disable-next-line no-unused-vars
const pingHandler = server => {
  const details = {
    method: ['GET'],
    path: '/api/ping',
    options: {
      auth: Constants.AUTH.ALL,
      description: 'Ping for Site Monitoring - Access - ALL',
      tags: ['api'],
    },
    handler: async (_request, _h) => Constants.SUCCESS_RESPONSE,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: pingHandler,
};
