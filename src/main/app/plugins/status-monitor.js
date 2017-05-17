import HapiStatusMonitor from 'hapijs-status-monitor';
import Config from '../../config';

const plugin = {
  enabled: Config.get('env') === 'development',
  name: 'hapijs-status-monitor',
  plugin: {
    register: HapiStatusMonitor,
    options: {
      title: 'Liftoff Jumpstart v1.0 Server Status Monitor',
      path: '/status',
      routeConfig: {
        auth: false
      }
    }
  }
};

module.exports = plugin;
