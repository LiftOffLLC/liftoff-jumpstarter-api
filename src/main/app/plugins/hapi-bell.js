const Bell = require('@hapi/bell');
const Config = require('../../config');

// NOTE:: Required for hapi-bell
const plugin = {
  enabled: true,
  name: 'hapi-bell',
  plugin: {
    plugin: Bell,
    options: {},
  },
  callback: async (server, error) => {
    if (error) {
      server.log(['error'], 'Fail to install plugin: hapi-bell......');
    }
    const socialStrategyParams = Config.get('socialStartegyParams').toJS();
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(socialStrategyParams)) {
      const params = { provider: key, location: server.info.uri, ...value };
      server.auth.strategy(key, 'bell', params);
    }
    server.log(['info', 'bootup'], 'Installed plugin: hapi-bell...');
  },
};

module.exports = plugin;
