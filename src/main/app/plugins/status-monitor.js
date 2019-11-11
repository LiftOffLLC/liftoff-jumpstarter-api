import HapiStatusMonitor from 'hapijs-status-monitor';
import Config from '../../config';

const plugin = {
  enabled: false,
  name: 'hapijs-status-monitor',
  plugin: {
    plugin: HapiStatusMonitor,
    options: {
      title: 'Liftoff Jumpstart v1.0 Server Status Monitor',
      path: '/status',
      routeConfig: {
        auth: false,
      },
    },
  },
};

module.exports = plugin;
