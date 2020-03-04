const socialAuthDisconnect = require('../../commons/socialAuth.disconnect');

module.exports = {
  enabled: true,
  operation: socialAuthDisconnect('facebook'),
};
