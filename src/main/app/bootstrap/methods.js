/* eslint-disable arrow-body-style,promise/avoid-new */
const _ = require('lodash');
const requireDirs = require('require-directory'); // eslint-disable-line hapi/hapi-capitalize-modules
const Promise = require('bluebird');

// This plugin is used to make hapi support handler as async function
const registerAsyncMethods = async (server, methodInstance) => {
  const methodsAsync = {};

  const obj = _.cloneDeep(methodInstance);
  if (!_.isUndefined(obj)) {
    const methods = _.isArray(obj) ? obj : [obj];
    await Promise.all(
      _.each(methods, method => {
        if (_.isObject(method) && _.isFunction(method.method)) {
          const instance = _.clone(method);
          // store the original method
          const asyncMethod = method.method;

          delete instance.description;
          delete instance.async;
          delete instance.enabled;
          // convert async function to normal thunky function
          instance.method = async (...args) => {
            // the handler after function is called
            const after = args[args.length - 1];
            try {
              // call the async method, since asyn function return promise,
              // use then and catch to handle result and error by handler
              const result = await asyncMethod.apply(this, args);
              after(null, result);
            } catch (err) {
              after(err);
            }
          };
          server.method(instance);
        }
      }),
    );
  }

  _.each(server.methods, (method, name) => {
    // eslint-disable-next-line space-before-function-paren,
    methodsAsync[name] = (...args) => {
      // async function is a function return promise
      // convert back the async function
      return new Promise((resolve, reject) => {
        // call the thunky function
        // eslint-disable-next-line prefer-spread
        server.methods[name].apply(
          server.methods,
          args.concat([
            (err, result) => {
              // reject if error exists, resolve if error not exists
              return err ? reject(err) : resolve(result);
            },
          ]),
        );
      });
    };
    // drop cache should also support async
    if (method.cache) {
      methodsAsync[name].cache = Promise.promisifyAll(method.cache);
    }
  });
  server.decorate('server', 'asyncMethods', methodsAsync);
};

// configure routes - routes will be picked from ./controllers folder.
module.exports = async server => {
  const methods = requireDirs(module, '../methods');
  const enabledMethods = _.filter(methods, ['enabled', true]);
  await Promise.all(
    _.each(enabledMethods, async method => {
      server.log(['info', 'bootup'], `registering method - ${method.name}`);
      const methodInfo = _.pick(method, ['name', 'method', 'options']);
      if (method.async) {
        await registerAsyncMethods(server, methodInfo);
      } else {
        // will be available as methods.xxx
        server.method(methodInfo);
      }
      server.log(
        ['info', 'bootup'],
        `finished registering method - ${method.name}`,
      );
    }),
  );
};
