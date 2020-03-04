const MrHorse = require('mrhorse');
const path = require('path');

const plugin = {
  enabled: true,
  name: 'mrhorse',
  plugin: {
    plugin: MrHorse,
    options: {
      policyDirectory: path.join(__dirname, '..', 'policies'),
    },
  },
  require: ['good'],
};

module.exports = plugin;
