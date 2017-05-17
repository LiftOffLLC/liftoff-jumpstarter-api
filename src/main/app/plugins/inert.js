import Inert from 'inert';

// NOTE:: Required for swagger
const plugin = {
  enabled: true,
  name: 'inert',
  plugin: {
    register: Inert,
    options: {}
  },
  require: ['good']
};

module.exports = plugin;
