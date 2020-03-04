/* eslint-disable import/first */
/* eslint-disable import/imports-first,vars-on-top,no-var,import/no-extraneous-dependencies */

// Enable newrelic for worker
require('newrelic');

const Worker = require('./app/commons/worker');

Worker.listen();
