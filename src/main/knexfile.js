/* eslint-disable import/no-extraneous-dependencies */
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `../../.env.${env}` });
const Config = require('./config');
const databaseConfig = Config.get('database').get('postgres').toJS();

module.exports = {
  development: databaseConfig,
  staging: databaseConfig,
  production: databaseConfig,
  test: databaseConfig,
};
