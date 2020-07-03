const Boom = require('@hapi/boom');
const _ = require('lodash');
const Constants = require('./constants');

const resourceCheckHandler = async (model, request, _h) => {
  const data = await model.findOne(
    model.buildCriteriaWithObject(request.params),
  );
  if (_.isEmpty(data)) {
    throw Boom.notFound('Resource Not Found');
  }
  return Constants.SUCCESS_RESPONSE;
};

const checkResourceExistence = (pathPrefix, params, model) => {
  const options = {
    auth: false,
    description: `HEAD ${pathPrefix} - Access -ALL`,
    notes: 'Allowed Access - ALL',
    tags: ['api'],
    validate: {
      params: params.pathParams,
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [201, 403]),
      },
      policies: params.policies || [],
    },
    handler: async (request, h) =>
      await resourceCheckHandler(model, request, h),
  };

  return () => ({
    method: ['GET'],
    path: `/api/${pathPrefix}`,
    options,
  });
};

module.exports = {
  resourceCheckHandler,
  checkResourceExistence,
};
