const UserRole = require('../models/userRole');

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
      description: 'Invalid credentials',
    },
    403: {
      description: 'Forbidden Access',
    },
  },
  AUTH: {
    ALL: false,
    ADMIN_ONLY: {
      strategy: 'jwt',
      mode: 'required',
      scope: [UserRole.ADMIN],
    },
    ADMIN_OR_USER: {
      strategy: 'jwt',
      mode: 'required',
      scope: [UserRole.ADMIN, UserRole.USER],
    },
    ADMIN_OR_USER_OR_GUEST: {
      strategy: 'jwt',
      mode: 'optional',
      scope: [UserRole.ADMIN, UserRole.USER, UserRole.GUEST],
    },
  },
};
