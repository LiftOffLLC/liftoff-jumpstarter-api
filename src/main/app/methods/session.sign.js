const JWT = require('jsonwebtoken');
const Config = require('../../config');

module.exports = {
  name: 'sessionsSign',
  description: 'Signs sessions',
  enabled: true,
  async: false,
  method: session => {
    const jwtConfig = Config.get('auth').toJS();
    return JWT.sign(session, jwtConfig.key, jwtConfig.signOptions || {});
  },
};
