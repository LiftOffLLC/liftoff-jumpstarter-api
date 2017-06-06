import Path from 'path';
import Constants from '../../commons/constants';

// NOTE: Swagger documentation not needed.
const options = {
  auth: Constants.AUTH.ALL,
  description: 'cross-domain handler required for kaltura',
  handler: async(request, reply) => reply.file(Path.join(__dirname, '..', '..', 'public', 'crossdomain.xml'))
};

// eslint-disable-next-line no-unused-vars
const handler = (server) => {
  const details = {
    method: ['GET'],
    path: '/crossdomain.xml',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
