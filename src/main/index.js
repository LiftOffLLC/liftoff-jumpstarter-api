/* eslint-disable no-console */
require('newrelic');
const knexClass = require('knex');
const Config = require('./config');
const Bootstrap = require('./app/bootstrap');
// Configure Winston Logger for logging in utils, models, etc.
// eslint-disable-next-line no-unused-vars

// NOTE: event name is camelCase as per node convention
process.on('unhandledRejection', (reason, promise) => {
  // See Promise.onPossiblyUnhandledRejection for parameter documentation
  console.log(
    'Possibly Unhandled Rejection at: Promise ',
    promise,
    ' reason: ',
    reason,
  );
});

// NOTE: event name is camelCase as per node convention
process.on('rejectionHandled', promise => {
  // See Promise.onUnhandledRejectionHandled for parameter documentation
  console.log('Possibly Unhandled Rejection at: Promise ', promise);
});

console.log(Date.now(), '::: bootstraping ::::: ');
// create server instance
const server = Bootstrap.server(Config);

const configureDatabase = async () => {
  try {
    const dbConfig = Config.get('database').get('postgres').toJS();
    const knex = knexClass(dbConfig);

    await knex.raw(dbConfig.validateQuery);

    if (dbConfig.recreateDatabase === 'true') {
      console.log(
        Date.now(),
        '::: running database migration :::: started !!!',
      );
      await knex.migrate.rollback(dbConfig);
      await knex.migrate.latest(dbConfig);

      // Populate Seed Data
      await knex.seed.run(dbConfig);
      // Flush all Redis keys...
      // eslint-disable-next-line global-require
      const RedisClient = require('./app/commons/redisClient');

      await RedisClient.flushDB();
      console.log(Date.now(), '::: running database migration :::: ended !!!');
    }
  } catch (e) {
    console.error('could not configure database: ', e);
    throw e;
  }
};

const start = async () => {
  try {
    // configure database.
    console.log(Date.now(), ':::: about to configure database ::::');
    await configureDatabase();

    // configure methods.
    console.log(Date.now(), ':::: loading worker ::::');
    // eslint-disable-next-line global-require
    require('./app/commons/worker');

    if (Config.get('server').get('startScheduler')) {
      // eslint-disable-next-line global-require
      const Scheduler = require('./app/schedulers');
      const config = Config.get('worker').toJS();
      config.prefix = 'scheduler';
      /**
       * Initialize the Queue
       */
      console.log(Date.now(), ':::: loading cron jobs ::::');
      await Scheduler.initQueue(config);
    }

    // load all necessary plugins.
    console.log(Date.now(), ':::: loading server plugins ::::');
    await Bootstrap.plugins(server);

    // configure routes.
    console.log(Date.now(), ':::: loading server routes ::::');
    await Bootstrap.routes(server);

    // configure methods.
    console.log(Date.now(), ':::: loading server methods ::::');
    await Bootstrap.methods(server);

    // Start the worker threads.
    if (Config.get('env') !== 'production') {
      require('./worker'); // eslint-disable-line global-require
    }

    // eslint-disable-next-line global-require

    // NOTE: works only if Nes is installed.
    // TODO: See if we can move inside nes-plugin callback.
    // server.subscription('/socket/notifications', {
    //   filter: (path, message, options, next)
    // => next(message.userId === options.credentials.userId)
    // });

    // server.decorate('request', 'sendSocketNotification',
    //   function sendSocketNotification(notificationType, targetUserId, data) {
    //     const finalData = _.cloneDeep(data);
    //     Object.assign(finalData, {
    //       type: notificationType,
    //       userId: targetUserId
    //     });
    //     this.server.publish('/socket/notifications', finalData);
    //   });

    /**
    start the server
    The if (!module.parent) {…} conditional makes sure that if the script is being
    required as a module by another script, we don’t start the server. This is done
    to prevent the server from starting when we’re testing it; with Hapi, we don’t
    need to have the server listening to test it.
    */
    if (!module.parent) {
      console.log(Date.now(), ':::: starting server ::::');

      await server.start();

      console.log(
        Date.now(),
        `${server.settings.app.get('server').get('name')} started at ${
          server.info.uri
        }`,
      );
    }
  } catch (e) {
    console.error('could not start server: ', e);
    throw e;
  }
};

console.log(Date.now(), '::: booting up ::::: ');
start();
module.exports = server;
