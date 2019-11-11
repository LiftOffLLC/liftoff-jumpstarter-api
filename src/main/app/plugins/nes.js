import Nes from 'nes';

const plugin = {
  enabled: false,
  name: 'nes',
  plugin: {
    plugin: Nes,
    options: {},
  },
  require: ['good', 'hapi-auth-jwt2'],
};

module.exports = plugin;
