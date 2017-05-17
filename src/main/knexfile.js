/* eslint-disable import/no-extraneous-dependencies */
require('babel-register')();
const Config = require('./config');

const databaseConfig = Config.get('database').get('postgres').toJS();
module.exports = {
  development: databaseConfig,
  staging: databaseConfig,
  production: databaseConfig,
  test: databaseConfig
};
