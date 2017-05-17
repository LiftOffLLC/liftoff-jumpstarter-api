import Vision from 'vision';

// NOTE:: Required for swagger
const plugin = {
  enabled: true,
  name: 'vision',
  plugin: {
    register: Vision,
    options: {}
  },
  require: ['good']
};

module.exports = plugin;
