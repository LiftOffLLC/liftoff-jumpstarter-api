const socialAuthSignup = require('../../commons/socialAuth.signup');

module.exports = {
  enabled: true,
  operation: socialAuthSignup('facebook'),
};
