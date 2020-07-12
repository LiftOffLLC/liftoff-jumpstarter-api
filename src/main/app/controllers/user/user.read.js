const UserModel = require('../../models/user');
const { readAPI } = require('../../commons/read.api');
const Constants = require('../../commons/constants');

module.exports = {
  enabled: true,
  operation: readAPI(
    'users',
    {
      auth: Constants.AUTH.ADMIN_OR_USER_OR_GUEST,
    },
    UserModel,
  ),
};
