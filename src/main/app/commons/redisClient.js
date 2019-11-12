/* eslint-disable class-methods-use-this */
import Redis from 'redis';
import Promise from 'bluebird';
import Logger from '../commons/logger';
import _ from 'lodash';
import Config from '../../config';

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
    for (const pattern of keyPatterns) {
      const keys = await this.redisClient.keysAsync(pattern);
      for (const key of keys) {
        Logger.info('redisClient: deleteKeys -- key :: ', key);
        keysToDelete.push(key);
      }
    }

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

export default new RedisClient();
