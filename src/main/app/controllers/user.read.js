import UserModel from '../models/user';
import readAPI from '../commons/read.api';
import Constants from '../commons/constants';

module.exports = {
  enabled: true,
  operation: readAPI('users', {
    auth: Constants.AUTH.ADMIN_OR_USER_OR_GUEST
  }, UserModel)
};
