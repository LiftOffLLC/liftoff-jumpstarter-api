import Hapi from 'hapi';
import _ from 'lodash';

// export server module.
module.exports = config => {
  const cacheConfig = config
    .get('server')
    .get('cache')
    .toJS();
  const host = config.get('server').get('host');
  const port = config.get('server').get('port');
  const cookieState = {
    parse: false, // Parse content of req.headers.cookie
    failAction: 'ignore', // Action on bad cookie - 'error': return 400, 'log': log and continue, 'ignore': continue
  };
  const cors = _.zipObject(['cors', 'state'], [true, cookieState]);
  const server = new Hapi.Server(
    _.zipObject(
      ['app', 'cache', 'host', 'port', 'routes'],
      [config, cacheConfig, host, port, cors],
    ),
  );
  return server;
};
