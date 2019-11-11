import Boom from 'boom';
import Logger from 'winston';

/**
Policy to verify that only https is supported.
*/
const requireHTTPs = async (request, h, next) => {
  Logger.info(__filename, 'entry');
  const protocol = request.headers['x-forwarded-proto'];
  const supported = protocol === 'https';
  Logger.info(__filename, 'exit');
  if (supported) {
    return h.continue;
  }
  Boom.create(505, 'protocol not supported');
};

requireHTTPs.applyPoint = 'onPreAuth';
module.exports = requireHTTPs;
