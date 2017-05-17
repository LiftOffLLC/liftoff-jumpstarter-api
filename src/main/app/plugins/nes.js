import Nes from 'nes';

const plugin = {
  enabled: false,
  name: 'nes',
  plugin: {
    register: Nes,
    options: {}
  },
  require: ['good', 'hapi-auth-jwt2']
};

module.exports = plugin;
