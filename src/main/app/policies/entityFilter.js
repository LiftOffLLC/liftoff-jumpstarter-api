/* eslint-disable no-unused-vars,no-underscore-dangle */
const _ = require('lodash');
const Logger = require('../commons/logger');
const Utils = require('../commons/utils');
const UserScope = require('../models/user').scope();

const omitEntities = async (items, scope) => {
  await Utils.traverseDeep(items, async obj => {
    if (obj.ENTITY_FILTERING_SCOPE) {
      const omitFields = obj.ENTITY_FILTERING_SCOPE[scope];
      if (omitFields) {
        let omitFieldList = [];
        if (_.isArray(omitFields)) {
          omitFieldList = omitFields;
        }

        if (omitFields === 'all') {
          omitFieldList = _.keys(obj);
        }
        _.each(omitFieldList, field => _.set(obj, field, undefined));
      }

      _.set(obj, 'ENTITY_FILTERING_SCOPE', undefined);
    }
  });

  return items;
};

/**
  Policy to filter entities/properties from response payload
*/
const entityFilter = async (request, h) => {
  try {
    Logger.info(`${__filename} entry`);
    const response = request.response.source;
    const scope = _.get(request, 'auth.credentials.scope') || UserScope.GUEST;
    await omitEntities(response, scope);
    Logger.info(`${__filename} exit`);
  } catch (err) {
    Logger.error(`${__filename} exit :: error `, err);
  }

  return h.continue;
};

entityFilter.applyPoint = 'onPostHandler';
module.exports = entityFilter;
