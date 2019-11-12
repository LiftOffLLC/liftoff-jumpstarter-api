import socialAuthDisconnect from '../../commons/socialAuth.disconnect';

module.exports = {
  enabled: true,
  operation: socialAuthDisconnect('facebook'),
};
