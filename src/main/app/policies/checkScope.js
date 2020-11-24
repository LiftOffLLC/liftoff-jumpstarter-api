/* eslint-disable no-unused-vars,no-underscore-dangle */
const _ = require('lodash');
const Logger = require('../commons/logger');
const UserScope = require('../models/user').scope();

const checkScope = async (request, h) => {
  try {
    Logger.info(`${__filename} entry`);
    const user = _.get(request, 'auth.credentials.user');
    if (_.isUndefined(user)) {
      _.set(request, 'auth.credentials.scope', UserScope.GUEST);
    }
    Logger.info(`${__filename} exit`);
  } catch (err) {
    Logger.error(`${__filename} exit :: error `, err);
  }

  return h.continue;
};

checkScope.applyPoint = 'onPreHandler';
module.exports = checkScope;
