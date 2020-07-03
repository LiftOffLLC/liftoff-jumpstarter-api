/* eslint-disable no-console,consistent-return */
// Code borrowed from
// http://pm2.keymetrics.io/docs/usage/use-pm2-with-cloud-providers
const pm2 = require('pm2');

// Set by Heroku or -1 to scale to max cpu core -1
const instances = parseInt(process.env.WEB_CONCURRENCY, 10);
// Max Memory per core
const maxMemory = parseInt(process.env.WEB_MEMORY, 10);

const pmConfig = {
  script: 'src/main/index.js',
  name: 'rest-api',
  exec_mode: 'cluster',
  instances,
  max_memory_restart: `${maxMemory}M`,
};

pm2.connect(() => {
  pm2.start(pmConfig, err => {
    if (err) {
      return console.error(
        'Error while launching applications',
        err.stack || err,
      );
    }
    console.log('PM2 and application has been succesfully started');

    // Display logs in standard output
    pm2.launchBus((error, bus) => {
      console.log('[PM2] Log streaming started');
      bus.on('log:out', packet => console.log(packet.data));
      bus.on('log:err', packet => console.error(packet.data));
    });
  });
});
