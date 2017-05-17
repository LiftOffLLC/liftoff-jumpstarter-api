/* eslint-disable class-methods-use-this */
import Redis from 'redis';
import Promise from 'bluebird';
import Logger from 'winston';
import _ from 'lodash';
import Config from '../../config';

Promise.promisifyAll(Redis.RedisClient.prototype);
Promise.promisifyAll(Redis.Multi.prototype);

class RedisClient {
  constructor() {
    const redisConfig = Config.get('database').get('redis').toJS();
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
    Logger.info('redisClient: saveSession :', key, ', value : ', object);
    return await this.redisClient.setAsync(key, JSON.stringify(object));
  }

  async getSession(userId, sessionId) {
    const key = this.getSessionKey(userId, sessionId);
    const val = await this.redisClient.getAsync(key);
    Logger.info('redisClient: getSession :', key, ', value : ', val);
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

  // VOTES
  getVoteCountKey(objectType, objectId, voteType) {
    return _.join(['votes', objectType, objectId, `${voteType}Count`], ':');
  }

  async updateVoteCount(objectType, objectId, voteType, voteCount) {
    const key = this.getVoteCountKey(objectType, objectId, voteType);
    Logger.info('redisClient: updateVoteCount :', key, ', value : ', voteCount);
    return await this.redisClient.setAsync(key, voteCount);
  }

  async getVoteCount(objectType, objectId, voteType) {
    const key = this.getVoteCountKey(objectType, objectId, voteType);
    const val = await this.redisClient.getAsync(key);
    Logger.info('redisClient: getVoteCount :', key, ', value : ', val);
    return Number(val) || 0;
  }

  async getAllVoteCount(keys) {
    if (_.isEmpty(keys)) {
      return {};
    }
    const transaction = this.redisClient.multi();
    _.each(keys, key => transaction.get(key));
    const values = await transaction.execAsync();
    Logger.info('redisClient: getAllVoteCount :', keys, ', value : ', values);
    return _.zipObject(keys, values);
  }

  // Blacklisted Domains
  async deleteBlacklistedDomains() {
    const key = 'blacklisted:emails';
    await this.deleteKeys([key]);
  }

  async addBlacklistedDomains(values = []) {
    const key = 'blacklisted::emails';
    Logger.info('redisClient: addBlacklistedDomains :', key, ', value : ', values);
    return await this.redisClient.saddAsync(key, values);
  }

  async isBlacklistedDomains(value) {
    if (_.isEmpty(value)) {
      return true;
    }
    const key = 'blacklisted::emails';
    Logger.info('redisClient: isBlacklistedDomains :', key, ', value : ', value);
    return await this.redisClient.sismemberAsync(key, value) === 1;
  }

  // Kaltura Processed Tokens
  getKalturaLiveTokenKey() {
    return 'kaltura:live:tokens';
  }

  async deleteKalturaLiveToken(value) {
    const key = this.getKalturaLiveTokenKey();
    Logger.info('redisClient: deleteKalturaLiveToken :', key, ', value : ', value);
    return await this.redisClient.sremAsync(key, value);
  }

  async addKalturaLiveToken(values = []) {
    const key = this.getKalturaLiveTokenKey();
    Logger.info('redisClient: addKalturaLiveToken :', key, ', value : ', values);
    return await this.redisClient.saddAsync(key, values);
  }

  async isKalturaLiveToken(value) {
    if (_.isEmpty(value)) {
      return true;
    }
    const key = this.getKalturaLiveTokenKey();
    Logger.info('redisClient: addKalturaLiveToken :', key, ', value : ', value);
    return await this.redisClient.sismemberAsync(key, value) === 1;
  }
}

export default new RedisClient();
