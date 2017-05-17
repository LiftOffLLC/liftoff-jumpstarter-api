import socialAuthLogin from '../commons/socialAuth.login';

module.exports = {
  enabled: true,
  operation: socialAuthLogin('facebook')
};
