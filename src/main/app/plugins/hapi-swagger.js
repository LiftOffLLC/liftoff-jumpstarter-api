import HapiSwagger from 'hapi-swagger';

const plugin = {
  enabled: true,
  name: 'hapi-swagger',
  plugin: {
    register: HapiSwagger,
    options: {
      basePath: '/api/',
      info: {
        title: 'Liftoff Jumpstart v1.0 REST API Docs',
        description: `NOTE: Top-level user roles are classified as ADMIN, USER or GUEST. 
        <br> <strong>ADMIN</strong> is registered super user, <strong>USER</strong> is registered User,
        where as <strong>GUEST</strong> is not a registered user.
        <br> Model based roles are defined per endpoint, like FAN, CREATOR, etc.
        <br> Watch out for each endpoint description for appropriate access.`,
        version: '1.0.0'
      },
      securityDefinitions: {
        jwt: {
          type: 'apiKey',
          name: 'Authorization',
          // eslint-disable-next-line quote-props
          'in': 'header'
        }
      },
      pathPrefixSize: 2,
      payloadType: 'json',
      produces: ['application/vnd.companyName.v1+json', 'application/json'],
      consumes: ['application/vnd.companyName.v1+json', 'application/json']
    }
  },
  require: ['good', 'inert', 'vision']
};

module.exports = plugin;
