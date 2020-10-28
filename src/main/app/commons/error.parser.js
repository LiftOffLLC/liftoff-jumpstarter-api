const Boom = require('@hapi/boom');
const Logger = require('./logger');

module.exports = {
  parsePayloadErrors: async (_request, _h, err) => {
    Logger.error('ValidationError:: ', err);
    throw err;
  },

  throwError: async err => {
    if (Boom.isBoom(err)) {
      throw err;
    } else throw Boom.badImplementation(err);
  },
};
