const _ = require('lodash');
const Promise = require('bluebird');
const Fs = require('fs');
const Path = require('path');
const { EmailTemplate } = require('email-templates');
const Config = require('../../config');

const templateDir = Path.join(__dirname, '..', 'views', 'mail-templates');
const mailAddress = Config.get('mailAddress').toJS();

function getDefaultFromAddress(templateName) {
  const returnValue = {};

  switch (templateName) {
    case 'welcome-msg':
      returnValue.from = mailAddress.info;
      break;

    case 'password-reset':
      returnValue.from = mailAddress.support;
      break;

    default:
      break;
  }

  return returnValue;
}

module.exports = async function getMailTemplate(templateName, variables = {}) {
  const returnValue = getDefaultFromAddress(templateName);

  if (templateName && !Fs.existsSync(Path.join(templateDir, templateName))) {
    throw new Error(`template : ${templateName} not found.`);
  }

  const template = new EmailTemplate(Path.join(templateDir, templateName));
  const render = Promise.promisify(template.render, {
    context: template,
    multiArgs: true,
  });
  const resultList = await render(variables);

  const result = _.isArray(resultList) ? _.head(resultList) : resultList;
  Object.assign(returnValue, {
    html: result.html,
    text: result.text || result.html,
    subject: result.subject,
  });
  return returnValue;
};
