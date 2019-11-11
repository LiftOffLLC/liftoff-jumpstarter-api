import Vision from 'vision';

// NOTE:: Required for swagger
const plugin = {
  enabled: true,
  name: 'vision',
  plugin: {
    plugin: Vision,
    options: {},
  },
  require: ['good'],
};

module.exports = plugin;
