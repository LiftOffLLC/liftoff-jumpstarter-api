/* eslint-disable no-unused-vars */
const Util = require('util');
const Joi = require('@hapi/joi');
const _ = require('lodash');
const dbUtil = require('./dbUtil');
const UserRole = require('../models/userRole');
const Constants = require('./constants');
const { throwError } = require('./error.parser');

const readHandler = async (model, request, _h) => {
  const criteriaOpts = {
    limit: request.query.limit,
    offset: request.query.offset,
    columns: _.compact(_.words(request.query.fields, /[^, ]+/g)),
  };

  // includeInactive - for user - should select all active once, and for admin should select both.
  const isAdmin = _.get(request, 'auth.credentials.scope') === UserRole.ADMIN;
  const filterOpts = dbUtil.fetchFilterCriteria(request.query.filters, isAdmin);
  const count = await model.count(_.cloneDeep(filterOpts));
  const items = await model.findAll(_.cloneDeep(filterOpts), criteriaOpts);

  return {
    count,
    items,
  };
};

const readAPI = (pathPrefix, params, model, fromCache = false) => {
  const options = {
    auth: params.auth || false,
    description: `Get ${pathPrefix} - Access - ${
      params.auth ? params.auth.scope : 'ALL'
    }`,
    notes: `Allowed Access - ${params.auth ? params.auth.scope : 'ALL'}
    <br>
    Relations - ${_.join(_.keys(model.relationMappings), ', ')}`,
    tags: ['api'],
    validate: {
      params: params.pathParams,
      query: Joi.object({
        offset: Joi.number()
          .integer()
          .min(0)
          .default(0)
          .description('Offset')
          .optional(),
        limit: Joi.number()
          .integer()
          .positive()
          .min(1)
          .max(100)
          .default(20)
          .description('Limit')
          .optional(),
        fields: Joi.string().trim().description('Fields').optional(),
        filters: Joi.string().trim().description('Field filters').optional(),
        ...params.query,
      }),
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [201]),
      },
      policies: params.policies || [],
    },
    handler: async (request, h) => {
      try {
        if (fromCache) {
          return await request.server.methods.modelCache(model, request, h);
        }
        return await readHandler(model, request, h);
      } catch (err) {
        return throwError(err);
      }
    },
  };

  return () => ({
    method: ['GET'],
    path: `/api/${pathPrefix}`,
    options,
  });
};

module.exports = {
  readAPI,
  readHandler,
};
