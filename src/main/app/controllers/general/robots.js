import Path from 'path';
import Constants from '../../commons/constants';

// NOTE: Swagger documentation not needed.
const options = {
  auth: Constants.AUTH.ALL,
  description: 'robots.txt',
  handler: async(request, reply) => reply.file(Path.join(__dirname, '..', '..', 'public', 'robots.txt'))
};

// eslint-disable-next-line no-unused-vars
const handler = (server) => {
  const details = {
    method: ['GET'],
    path: '/robots.txt',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
