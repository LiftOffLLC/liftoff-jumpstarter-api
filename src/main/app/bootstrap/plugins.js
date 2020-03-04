const _ = require('lodash');
const toposort = require('toposort');
const requireDirs = require('require-dir');
const Boom = require('@hapi/boom');

const HapiAsyncHandler = {
  name: 'hapi-async-handler',
  version: '1.0.0',
  register: server => {
    const origRoute = server.route;

    const innerRoute = options => {
      const handler = _.get(options, 'config.handler');

      if (handler && handler instanceof Function) {
        const t = handler;

        const modifiedHandler = (request, h) => {
          const p = t(request, h);
          if (p && p.catch) {
            p.catch(err => {
              Boom.wrap(err instanceof Error ? err : new Error(err), 417);
            });
          }
        };

        _.set(options, 'config.handler', modifiedHandler);
      }

      return origRoute.apply(server, [options]);
    };

    // eslint-disable-next-line no-param-reassign
    server.route = options => {
      if (Array.isArray(options)) {
        return options.map(option => innerRoute(option));
      }
      return innerRoute(options);
    };
  },
};

// configure plugins - list of plugins will be loaded from plugins folder.
module.exports = async server => {
  const plugins = requireDirs('../plugins');
  const enabledPlugins = _.filter(plugins, ['enabled', true]);

  const errorHandler = {
    enabled: false,
    name: 'hapi-async-handler',
    plugin: {
      plugin: HapiAsyncHandler,
      options: {},
    },
  };

  enabledPlugins.push(errorHandler);

  const modules = {};
  _.each(enabledPlugins, plugin => {
    modules[plugin.name] = plugin;
  });

  // get all module name as key, which equal to node of vector graph
  const nodes = _.keys(modules);
  const edges = _.reduce(
    modules,
    (result, plugin, name) => {
      _.each(plugin.require, requirePlugin =>
        result.push([name, requirePlugin]),
      );
      return result;
    },
    [],
  );

  // const serverRegister = Promise.promisify(server.register, {
  //   context: server,
  //   multiArgs: true
  // });

  // do topological sort to make sure the order is right and exports
  const enabledPluginsTmp = _.map(
    _(toposort.array(nodes, edges))
      .reverse()
      .value(),
    name => modules[name],
  );

  return _.each(enabledPluginsTmp, async _plugin => {
    server.log(['info', 'bootup'], `registering plugin - ${_plugin.name}`);
    const err = await server.register(_plugin.plugin);
    if (!_.isEmpty(err)) {
      server.log(
        ['error', 'bootup'],
        `failed registering plugin - ${_plugin.name} - ${err}`,
      );
      throw err;
    }

    if (_plugin.callback && _.isFunction(_plugin.callback)) {
      server.log(
        ['info', 'bootup'],
        `Invoking plugin.callback - ${_plugin.name}`,
      );
      await _plugin.callback(server);
    } else {
      server.log(['info', 'bootup'], `Installed plugin - ${_plugin.name}`);
    }
    return true;
  });
};
