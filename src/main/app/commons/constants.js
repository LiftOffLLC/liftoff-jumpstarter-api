const UserRoleEnum = require('../models/userRole').loginRoles();

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
    404: {
      description: 'Not Found',
    },
  },

  AUTH: {
    ALL: false,
    ADMIN_ONLY: {
      strategy: 'jwt',
      mode: 'required',
      scope: [UserRoleEnum.ADMIN],
    },
    ADMIN_OR_USER: {
      strategy: 'jwt',
      mode: 'required',
      scope: [UserRoleEnum.ADMIN, UserRoleEnum.USER],
    },
    ADMIN_OR_USER_OR_GUEST: {
      strategy: 'jwt',
      mode: 'optional',
      scope: [UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.GUEST],
    },
  },

  ROLES: {
    ADMIN: 1,
    USER: 2,
  },
};
