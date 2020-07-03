const HapiSentry = require('hapi-sentry');
const Config = require('../../config');

const plugin = {
  enabled: Config.get('sentry').get('enabled'),
  name: 'hapi-sentry',
  plugin: {
    plugin: HapiSentry,
    options: {
      client: {
        dsn: Config.get('sentry').get('dsn'),
      },
    },
  },
  callback: async (server, error) => {
    if (error) {
      server.log(['error'], 'Fail to install plugin: hapi-sentry...');
    }
    server.log(['info', 'bootup'], 'Installed plugin: hapi-sentry');
  },
};

module.exports = plugin;
