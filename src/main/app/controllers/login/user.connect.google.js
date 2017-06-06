import socialAuthConnect from '../../commons/socialAuth.connect';

module.exports = {
  enabled: true,
  operation: socialAuthConnect('google')
};
