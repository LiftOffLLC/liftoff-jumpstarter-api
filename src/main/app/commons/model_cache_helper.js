const _ = require('lodash');
const Config = require('../../config');
const { cachedModels } = Config.get('model_cache').toJS();
const RedisClient = require('./redisClient');

module.exports = {
  isModelCached: model => _.includes(cachedModels, model.tableName),

  purgeModelCache: async () =>
    await RedisClient.deleteKeys(_.map(cachedModels, cm => `*${cm}*`)),
};
