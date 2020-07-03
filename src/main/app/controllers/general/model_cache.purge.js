const Constants = require('../../commons/constants');
const { purgeModelCache } = require('../../commons/model_cache_helper');

const cachePurgeHandler = _server => {
  const details = {
    method: ['DELETE'],
    path: '/api/model_cache/purge',
    options: {
      auth: Constants.AUTH.ADMIN_OR_USER,
      description: 'Purge cached model data - Access - admin, user',
      tags: ['api'],
    },
    handler: async (_request, _h) => {
      await purgeModelCache();
      return Constants.SUCCESS_RESPONSE;
    },
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: cachePurgeHandler,
};
