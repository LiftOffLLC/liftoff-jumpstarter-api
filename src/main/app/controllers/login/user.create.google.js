import socialAuthSignup from '../../commons/socialAuth.signup';

module.exports = {
  enabled: true,
  operation: socialAuthSignup('google'),
};
