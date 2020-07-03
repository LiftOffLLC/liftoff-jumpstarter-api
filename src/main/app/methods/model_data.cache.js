const _ = require('lodash');
const Config = require('../../config');
const { readHandler } = require('../commons/read.api');

const cacheConfig = Config.get('model_cache').toJS();
const serverCacheConfig = Config.get('server').get('cache').toJS();

module.exports = {
  name: 'modelCache',
  description: 'Cache Model Data',
  enabled: true,
  async: false,
  method: async (...args) => await readHandler(...args),
  options: {
    cache: {
      cache: _.get(_.head(serverCacheConfig), 'name') || 'redis-cache',
      expiresIn: parseInt(cacheConfig.modelCacheDuration, 10),
      generateTimeout: parseInt(cacheConfig.modelCacheTimeout, 10),
    },
    generateKey: model => model.tableName,
  },
};
