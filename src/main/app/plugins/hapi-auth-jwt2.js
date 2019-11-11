import HapiAuthJWT2 from 'hapi-auth-jwt2';
import Config from '../../config';

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
    server.auth.strategy('jwt', 'jwt', {
      key: 'NeverShareYourSecret', // Never Share your secret key
      validate: Config.get('auth').toJS(),
    });
    server.log(['info', 'bootup'], 'Installed plugin: hapi-auth-jwt2');
  },
  require: ['good'],
};

module.exports = plugin;
