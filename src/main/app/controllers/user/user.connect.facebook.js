const socialAuthConnect = require('../../commons/socialAuth.connect');

module.exports = {
  enabled: true,
  operation: socialAuthConnect('facebook'),
};
