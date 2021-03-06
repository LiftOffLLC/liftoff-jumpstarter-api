const _ = require('lodash');
const Boom = require('@hapi/boom');
const Errors = require('../commons/errors');
const Logger = require('../commons/logger');
const UserScope = require('../models/user').scope();

/**
Policy to verify if the user is who he says to be or an admin.
Criteria is -- scope.admin || 'params.userId' || 'payload.userId' === scope.userId
*/
module.exports = function isAuthorized(userPath) {
  const testIsAuthorized = async (request, h) => {
    Logger.info(`${__filename} entry :: (userPath) :: `, userPath);
    const authScopeRole = _.get(request, 'auth.credentials.scope');
    const authScopeUserId = _.get(request, 'auth.credentials.userId');
    const actualUserId = _.get(request, userPath);

    // allow if admin role is found in scope.
    const exists =
      // eslint-disable-next-line
      UserScope.ADMIN == authScopeRole || authScopeUserId == actualUserId;
    Logger.info(`${__filename} entry :: (exists) :: `, exists);

    if (exists) {
      return h.continue;
    }
    throw Boom.illegal(Errors.authError);
  };

  testIsAuthorized.applyPoint = 'onPreHandler';
  return testIsAuthorized;
};
