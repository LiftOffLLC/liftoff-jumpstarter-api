import Worker from './worker';

// Adds Mail to Queue for later processing.
export default async function addMailToQueue(templateName, from, to, message, variableOpts = {}) {
  const value = {
    templateName,
    from,
    to,
    message,
    variableOpts
  };

  await Worker.addJob('emails.dispatch', value);
  return true;
}
