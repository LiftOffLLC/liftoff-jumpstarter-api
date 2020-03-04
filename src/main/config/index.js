const _ = require('lodash');
const immutable = require('immutable');
const defaultConfig = require('./default');

const env = process.env.NODE_ENV || 'development';
const config = _.merge({}, defaultConfig, require(`./${env}`)); // eslint-disable-line import/no-dynamic-require

/* eslint-enable no-process-env */
module.exports = immutable.fromJS(config);
