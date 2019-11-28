/* eslint-disable class-methods-use-this */
const Redis = require('redis');
const Promise = require('bluebird');
const _ = require('lodash');
const Logger = require('./logger');
const Config = require('../../config');

Promise.promisifyAll(Redis.RedisClient.prototype);
Promise.promisifyAll(Redis.Multi.prototype);

class RedisClient {
  constructor() {
    const redisConfig = Config.get('database')
      .get('redis')
      .toJS();
    this.redisClient = Redis.createClient(redisConfig);
  }

  async flushDB() {
    return await this.redisClient.flushallAsync();
  }

  // USER SESSIONS
  getSessionKey(userId, sessionId) {
    return _.join(['sessions', userId, sessionId], ':');
  }

  async saveSession(userId, sessionId, object) {
    const key = this.getSessionKey(userId, sessionId);
    Logger.info(`redisClient: saveSession : ${key}, value : `, object);
    return await this.redisClient.setAsync(key, JSON.stringify(object));
  }

  async getSession(userId, sessionId) {
    const key = this.getSessionKey(userId, sessionId);
    const val = await this.redisClient.getAsync(key);
    Logger.info(`redisClient: getSession : ${key}, value : `, val);
    return JSON.parse(val);
  }

  async deleteKeys(keyPatterns = []) {
    if (_.isEmpty(keyPatterns)) {
      return;
    }

    // If sessionId is not present, treat it all delete all user sessions.
    const keysToDelete = [];
    _.each(keyPatterns, async pattern => {
      const keys = await this.redisClient.keysAsync(pattern);
      _.each(keys, key => {
        Logger.info('redisClient: deleteKeys -- key :: ', key);
        keysToDelete.push(key);
      });
    });

    /**
     * Wait for the all the promises to resolve.
     */
    await Promise.all(keysToDelete);

    // Use Multi to delete all keys one-shot
    if (!_.isEmpty(keysToDelete)) {
      const transaction = this.redisClient.multi();
      _.each(keysToDelete, key => transaction.del(key));
      await transaction.execAsync();
    }
  }

  async deleteSession(userId, sessionId) {
    // If sessionId is not present, treat it all delete all user sessions.
    const key = this.getSessionKey(userId, sessionId || '*');
    await this.deleteKeys([key]);
  }
}

module.exports = new RedisClient();
