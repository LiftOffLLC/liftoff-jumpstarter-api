import _ from 'lodash';
import Config from '../../../config';
import Constants from '../../commons/constants';

const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Config Details - Access - ADMIN',
  tags: ['api'],
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201]),
    },
  },
  handler: async (_request, _h) => Config.toJS(),
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['GET'],
    path: '/api/appinfo',
    options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
