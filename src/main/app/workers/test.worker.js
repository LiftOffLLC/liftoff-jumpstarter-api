/**
 * Test job, does nothing but logging information about the job process and it's underlying data.
 */

const Logger = require('../commons/logger');

async function handler(job, done) {
  Logger.info('Processing test job.');
  Logger.info(job.data);
  Logger.info('done processing test job.');
  done();
}

/**
 * default job options which can be then customized while dispatching a job.
 * When a job provides it's own job options, it would be considered as final.
 * @see https://github.com/OptimalBits/bull/tree/develop/docs for more options.
 */
const options = {
  priority: 1,
  attempts: 5,
  // delay: 1000 * 5,
};

module.exports = {
  name: 'test',
  description: 'Test worker implementation.',
  enabled: true,
  options,
  handler,
};
