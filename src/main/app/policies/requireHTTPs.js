const Boom = require('boom');
const Logger = require('../commons/logger');

/**
Policy to verify that only https is supported.
*/
// eslint-disable-next-line consistent-return
const requireHTTPs = async (request, h) => {
  Logger.info(`${__filename} entry`);
  const protocol = request.headers['x-forwarded-proto'];
  const supported = protocol === 'https';
  Logger.info(`${__filename} exit`);
  if (supported) {
    return h.continue;
  }
  Boom.create(505, 'protocol not supported');
};

requireHTTPs.applyPoint = 'onPreAuth';
module.exports = requireHTTPs;
