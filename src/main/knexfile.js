/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');

require('dotenv').config({
  path: path.resolve(__dirname, '..', '..', '.env'),
});

const Config = require('./config');

const databaseConfig = Config.get('database')
  .get('postgres')
  .toJS();

module.exports = {
  development: databaseConfig,
  staging: databaseConfig,
  production: databaseConfig,
  test: databaseConfig,
};
