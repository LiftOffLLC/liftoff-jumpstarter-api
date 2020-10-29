/* eslint-disable no-console */
require('newrelic');
const Config = require('./config');
const configureDatabase = require('./configureDatabase');
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
class App {
  constructor() {
    console.log(Date.now(), ':::: bootstrapping :::: ');
    // create server instance
    this.server = Bootstrap.server(Config);
  }

  async configure() {
    try {
      console.log(Date.now(), ':::: booting up :::: ');

      if (
        Config.get('server').get('pm2') !== 'true' &&
        Config.get('env') !== 'test'
      ) {
        // configure database.
        console.log(Date.now(), ':::: about to configure database ::::');
        await configureDatabase();
      }

      // configure methods.
      console.log(Date.now(), ':::: loading worker ::::');
      // eslint-disable-next-line global-require
      this.worker = require('./app/commons/worker');

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
      await Bootstrap.plugins(this.server);

      // configure routes.
      console.log(Date.now(), ':::: loading server routes ::::');
      await Bootstrap.routes(this.server);

      // configure methods.
      console.log(Date.now(), ':::: loading server methods ::::');
      await Bootstrap.methods(this.server);
    } catch (e) {
      console.error('could not configure server: ', e);
      throw e;
    }
  }

  async init() {
    await this.configure();
    console.log(Date.now(), ':::: initializing server ::::');
    await this.server.initialize();
    console.log(Date.now(), 'initialized server');
  }

  async start() {
    await this.configure();
    console.log(Date.now(), ':::: starting server ::::');
    await this.server.start();
    console.log(
      Date.now(),
      `${this.server.settings.app.get('server').get('name')} started at ${
        this.server.info.uri
      }`,
    );
  }
}

const app = new App();

/**
  Start the server
  The 'if (!module.parent) {…}' conditional makes sure that if the script is being
  required as a module by another script, we don’t start the server. This is done
  to prevent the server from starting when we’re testing it with Hapi, we don’t
  need to have the server listening to test it.
*/
if (!module.parent) {
  app.start();
}

module.exports = app;
