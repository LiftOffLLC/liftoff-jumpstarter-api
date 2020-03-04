const _ = require('lodash');
const requireDirs = require('require-dir');
const Config = require('../../config');
const Utils = require('../commons/utils');
// configure routes - routes will be picked from ./controllers folder.
module.exports = async server => {
  const routes = [];
  const controllers = requireDirs('../controllers', {
    recurse: true,
  });

  const enabledRoutes = []; // _.filter(controllers, ['enabled', true]);
  await Utils.traverseDeep(controllers, async obj => {
    if (obj.enabled === true) {
      enabledRoutes.push(obj);
    }
  });

  _.each(enabledRoutes, controller => {
    const { operation } = controller;
    if (_.isFunction(operation)) {
      const func = operation(server);
      let policies = _.get(func, 'options.plugins.policies');
      if (!policies) {
        _.set(func, 'options.plugins.policies', []);
        policies = _.get(func, 'options.plugins.policies');
      }
      // Add this only for non-development env.
      if (Config.get('server').get('forceSSL') === 'true') {
        // add HTTP Check at beginning.
        policies.unshift('requireHTTPs');
      }
      policies.push('entityFilter');
      policies.push('boomResponseHandler');
      routes.push(func);
    }
  });
  server.route(routes);
};
