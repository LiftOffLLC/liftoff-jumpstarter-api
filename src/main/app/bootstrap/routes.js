import _ from 'lodash';
import requireDirs from 'require-dir';
import Config from '../../config';

// configure routes - routes will be picked from ./controllers folder.
module.exports = async(server) => {
  const routes = [];
  const controllers = requireDirs('../controllers');

  const enabledRoutes = _.filter(controllers, ['enabled', true]);
  _.each(enabledRoutes, (controller) => {
    const operation = controller.operation;
    if (_.isFunction(operation)) {
      const func = operation(server);
      let policies = _.get(func, 'config.plugins.policies');
      if (!policies) {
        _.set(func, 'config.plugins.policies', []);
        policies = _.get(func, 'config.plugins.policies');
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
