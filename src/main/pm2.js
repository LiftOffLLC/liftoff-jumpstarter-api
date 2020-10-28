/* eslint-disable no-console,consistent-return */
// Code borrowed from
// http://pm2.keymetrics.io/docs/usage/use-pm2-with-cloud-providers
const pm2 = require('pm2');
const Config = require('./config');
const configureDatabase = require('./configureDatabase');
const instances = Config.get('server').get('webConcurrency');
const maxMemory = Config.get('server').get('webMemory');

const pmConfig = {
  script: 'src/main/index.js',
  name: 'rest-api',
  exec_mode: 'cluster',
  instances,
  max_memory_restart: `${maxMemory}M`,
  env: {
    PM2: true,
  },
};

pm2.connect(async () => {
  // configure database.
  console.log(Date.now(), ':::: about to configure database ::::');
  await configureDatabase();

  pm2.start(pmConfig, err => {
    if (err) {
      return console.error(
        'Error while launching applications',
        err.stack || err,
      );
    }
    console.log('PM2 and application has been successfully started');

    // Display logs in standard output
    pm2.launchBus((error, bus) => {
      console.log('[PM2] Log streaming started');
      bus.on('log:out', packet => console.log(packet.data));
      bus.on('log:err', packet => console.error(packet.data));
    });
  });
});
