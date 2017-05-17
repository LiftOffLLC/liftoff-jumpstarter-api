import Boom from 'boom';
import Logger from 'winston';

/**
Policy to verify that only https is supported.
*/
const requireHTTPs = async(request, reply, next) => {
  Logger.info(__filename, 'entry');
  const protocol = request.headers['x-forwarded-proto'];
  const supported = (protocol === 'https');
  Logger.info(__filename, 'exit');
  return next(supported ? null : Boom.create(505, 'protocol not supported'), supported);
};

requireHTTPs.applyPoint = 'onPreAuth';
module.exports = requireHTTPs;
