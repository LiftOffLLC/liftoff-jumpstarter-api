/* eslint-disable no-unused-vars */
import Util from 'util';
import Joi from '@hapi/joi';
import _ from 'lodash';
import dbUtil from './dbUtil';
import UserRole from '../models/userRole';
import Constants from './constants';

async function readHandler(model, request, _h) {
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
}

export default function readAPI(pathPrefix, params, model) {
  const options = {
    auth: params.auth || false,
    description: `Get ${pathPrefix} - Access - ${
      params.auth ? params.auth.scope : 'ALL'
    }`,
    notes: `Get ${pathPrefix} - Allowed Access - ${
      params.auth ? params.auth.scope : 'ALL'
    }`,
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
          .max(50)
          .default(20)
          .description('Limit')
          .optional(),
        fields: Joi.string()
          .trim()
          .description('Fields')
          .optional(),
        filters: Joi.string()
          .trim()
          .description('Field filters')
          .optional(),
      }),
    },
    plugins: {
      'hapi-swagger': {
        responses: _.omit(Constants.API_STATUS_CODES, [201]),
      },
      policies: params.policies || [],
    },
    handler: async (request, h) => await readHandler(model, request, h),
  };

  return () => ({
    method: ['GET'],
    path: `/api/${pathPrefix}`,
    options,
  });
}
