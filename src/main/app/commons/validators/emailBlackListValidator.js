const _ = require('lodash');
const Joi = require('@hapi/joi');
const Fs = require('fs');
const Path = require('path');
const Logger = require('../logger');

// Blacklist Email File has been copied from
// https://raw.githubusercontent.com/martenson/disposable-email-domains/master/disposable_email_blacklist.conf
const blackListFile = Path.join(__dirname, 'disposable_email_blacklist.conf');
const domains = Fs.readFileSync(blackListFile)
  .toString()
  .split('\n');

/**
 * Check if the email is whitelisted.
 *
 * @param {string} email - email
 * @return {boolean} if whitelisted
 */
function isEmailBlacklisted(email) {
  const emailArray = email.split('@');
  const domain = emailArray[emailArray.length - 1];
  const isBlacklisted = _.includes(domains, domain);
  Logger.info(
    `isEmailBlacklisted :: email :: ${email}, - isBlacklisted :: ${isBlacklisted}`,
  );
  return isBlacklisted;
}

const emailBlackListValidator = Joi.extend({
  type: 'email',
  base: Joi.string()
    .trim()
    .lowercase()
    .email(),
  messages: {
    'email.isBlacklisted': 'is blacklisted',
  },
  rules: {
    isBlacklisted: {
      validate(value, helpers, state, options) {
        const isBlacklisted = isEmailBlacklisted(value);
        if (isBlacklisted) {
          // Generate an error, state and options need to be passed
          return helpers.error(
            'email.isBlacklisted',
            {
              v: value,
            },
            state,
            options,
          );
        }
        return value;
      },
    },
  },
});

module.exports = emailBlackListValidator;
