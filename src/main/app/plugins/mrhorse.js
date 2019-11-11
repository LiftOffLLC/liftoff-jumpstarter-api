import MrHorse from 'mrhorse';
import path from 'path';

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
