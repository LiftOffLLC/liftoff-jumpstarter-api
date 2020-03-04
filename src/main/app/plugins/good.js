const Good = require('@hapi/good');
const Config = require('../../config');

const loggerOptions = {
  ops: {
    interval: 900000,
  },
  includes: {
    request: ['headers', 'payload'],
    response: Config.get('env') === 'development' ? ['payload'] : [],
  },
  reporters: {
    console: [
      {
        module: '@hapi/good-squeeze',
        name: 'Squeeze',
        args: [
          {
            log: '*',
            ops: '*',
            error: '*',
            request: '*',
            response: '*',
          },
        ],
      },
      {
        // module: 'good-console'
        module: '@hapi/good-squeeze',
        name: 'SafeJson',
      },
      'stdout',
    ],
  },
};

const plugin = {
  enabled: true,
  name: 'good',
  plugin: {
    plugin: Good,
    options: loggerOptions,
  },
};

module.exports = plugin;
