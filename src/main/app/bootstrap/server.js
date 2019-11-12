const Hapi = require('@hapi/hapi');
const _ = require('lodash');

// export server module.
module.exports = config => {
  const cacheConfig = config
    .get('server')
    .get('cache')
    .toJS();

  _.each(cacheConfig, c => {
    c.provider.constructor = c.provider._constructor;
    delete c.provider._constructor;
  }); // hack to prevent toJS() from breaking coz of constructor property in cache config

  const host = config.get('server').get('host');
  const port = config.get('server').get('port');
  const cookieState = {
    parse: false, // Parse content of req.headers.cookie
    failAction: 'ignore', // Action on bad cookie - 'error': return 400, 'log': log and continue, 'ignore': continue
  };
  const cors = _.zipObject(['cors', 'state'], [true, cookieState]);

  // eslint-disable-next-line new-cap
  const server = new Hapi.server({
    app: config,
    cache: cacheConfig,
    host,
    port,
    routes: cors,
  });
  return server;
};
