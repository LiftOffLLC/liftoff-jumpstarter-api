const Logger = require('../commons/logger');
const Mailer = require('../commons/mailer');

async function handler(job, done) {
  Logger.info('emails.dispatch job running %j', job.data);

  const { templateName, from, to, message, variableOpts } = job.data;
  await Mailer.dispatchMail(templateName, from, to, message, variableOpts);

  done();
}

module.exports = {
  name: 'emails.dispatch',
  description: 'Deliver emails',
  enabled: true,
  priority: 'high',
  attempts: 5,
  handler,
};
