const HapiAuthJWT2 = require('hapi-auth-jwt2');
const Config = require('../../config');

const plugin = {
  enabled: true,
  name: 'hapi-auth-jwt2',
  plugin: {
    plugin: HapiAuthJWT2,
    options: {},
  },
  callback: async (server, error) => {
    if (error) {
      server.log(['error'], 'Fail to install plugin: hapi-auth-jwt2...');
    }
    server.auth.strategy('jwt', 'jwt', Config.get('auth').toJS());
    server.auth.default('jwt');
    server.log(['info', 'bootup'], 'Installed plugin: hapi-auth-jwt2');
  },
  require: ['good'],
};

module.exports = plugin;
