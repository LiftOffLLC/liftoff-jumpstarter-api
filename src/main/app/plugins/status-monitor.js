const HapiStatusMonitor = require('hapijs-status-monitor');

const plugin = {
  enabled: false,
  name: 'hapijs-status-monitor',
  plugin: {
    plugin: HapiStatusMonitor,
    options: {
      title: 'Liftoff Jumpstart v2.1 Server Status Monitor',
      path: '/status',
      routeConfig: {
        auth: false,
      },
    },
  },
};

module.exports = plugin;
