/* eslint-disable import/first */
/* eslint-disable import/imports-first,vars-on-top,no-var,import/no-extraneous-dependencies */

// Enable newrelic for worker
require('newrelic');

import Worker from './app/commons/worker';

Worker.processJobs();
