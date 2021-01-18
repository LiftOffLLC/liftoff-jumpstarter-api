const UserScope = require('../models/user').scope();

module.exports = {
  SUCCESS_RESPONSE: {
    success: true,
  },

  API_STATUS_CODES: {
    201: {
      description: 'Created',
    },
    200: {
      description: 'Success',
    },
    400: {
      description: 'Bad Request',
    },
    401: {
      description: 'Invalid Credentials',
    },
    403: {
      description: 'Forbidden Access',
    },
    404: {
      description: 'Not Found',
    },
  },

  AUTH: {
    ALL: false,
    ADMIN_ONLY: {
      strategy: 'jwt',
      mode: 'required',
      scope: [UserScope.ADMIN],
    },
    ADMIN_OR_USER: {
      strategy: 'jwt',
      mode: 'required',
      scope: [UserScope.ADMIN, UserScope.USER],
    },
    ADMIN_OR_USER_OR_GUEST: {
      strategy: 'jwt',
      mode: 'optional',
      scope: [UserScope.ADMIN, UserScope.USER, UserScope.GUEST],
    },
  },

  USER: {
    ROLE: ['admin', 'user'],
  },

  TRANSACTION: {
    STATUS: ['successful', 'needs-action'],
  },
};
