const Inert = require('@hapi/inert');

// NOTE:: Required for swagger
const plugin = {
  enabled: true,
  name: 'inert',
  plugin: {
    plugin: Inert,
    options: {},
  },
  require: ['good'],
};

module.exports = plugin;
