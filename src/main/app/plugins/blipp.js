import Blipp from 'blipp';
import Config from '../../config';

const plugin = {
  enabled: Config.get('env') === 'development',
  name: 'blipp',
  plugin: {
    plugin: Blipp,
    options: {},
  },
  require: ['good'],
};

module.exports = plugin;
