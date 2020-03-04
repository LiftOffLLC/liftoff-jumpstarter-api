const socialAuthLogin = require('../../commons/socialAuth.login');

module.exports = {
  enabled: true,
  operation: socialAuthLogin('facebook'),
};
