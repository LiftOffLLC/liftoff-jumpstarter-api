import _ from 'lodash';
import DataObjectParser from 'dataobject-parser';
import Logger from './logger';

const selectFields = fieldsStr => _.compact(_.words(fieldsStr, /[^, ]+/g));

const tableColumnMapping = fields => {
  const tableColumns = {};
  tableColumns['_'] = []; // eslint-disable-line dot-notation
  const fieldArray = selectFields(fields);
  _.each(fieldArray, str => {
    const parts = str.split('.');
    const tableName =
      _.size(parts) === 1 ? '_' : _.take(parts, parts.length - 1).join('.');
    tableColumns[tableName] = tableColumns[tableName] || [];
    tableColumns[tableName].push(_.last(parts));
  });
  return tableColumns;
};

exports.getEagerColumnString = data => {
  const objData = _.zipObject(data, _.fill(Array(_.size(data)), true));
  const obj = DataObjectParser.transpose(objData);
  const string = JSON.stringify(obj.data());
  // Order is important, otherwise it may screw up the fetch..
  // DON'T SCREW AROUND, IF YOU"RE NOT SURE WHAT YOU"RE DEALING WITH...
  const eagerString = string
    .replace(/:true/g, '')
    .replace(/:{/g, '.[')
    .replace(/}/g, ']')
    .replace(/"/g, '')
    .replace(/{/g, '[');
  return eagerString;
};

exports.buildOptions = (filters, options) => {
  const filOpts = _.cloneDeep(filters);
  const columns = tableColumnMapping(options.columns);

  const testOptions = {};
  _.each(columns, (value, key) => {
    testOptions[key] = _.zipObject(['columns'], [value]);
  });

  _.each(_.keys(testOptions), key => {
    const prefix = key !== '_' ? `${key}.` : '';
    // Fix Limit Field
    const limitFieldKey = `${prefix}limit`;
    const limit =
      options[limitFieldKey] ||
      _.get(
        _.find(filOpts, _.matchesProperty('field', limitFieldKey)),
        'value',
      );
    if (Number(limit) > 0) {
      testOptions[key].limit = Number(limit);
    }

    // Fix Offset Field
    const offsetFieldKey = `${prefix}offset`;
    const offset =
      options[offsetFieldKey] ||
      _.get(
        _.find(filOpts, _.matchesProperty('field', offsetFieldKey)),
        'value',
      );
    if (Number(offset) > 0) {
      testOptions[key].offset = Number(offset);
    }

    // Fix Sort Field
    const sortFieldKey = `${prefix}sortField`;
    const sortField = _.find(filOpts, _.matchesProperty('field', sortFieldKey));
    if (sortField) {
      testOptions[key].sortField = sortField.value;
    }

    // Fix Sort Order
    const sortOrderKey = `${prefix}sortOrder`;
    const sortOrder = _.find(filOpts, _.matchesProperty('field', sortOrderKey));
    if (sortOrder) {
      // && _.includes(['asc', 'desc'], sortOrder.value.toLowerCase())) {
      testOptions[key].sortOrder = sortOrder.value;
    }
  });

  // knock off all the reserved keys; its needed for count* apis.
  _.each(['limit', 'offset', 'sortField', 'sortOrder'], key => {
    _.remove(filOpts, hash => _.endsWith(hash.field, key));
  });

  // Add filter list to top-most table
  _.set(testOptions, '_.filters', filOpts);
  return testOptions;
};

function buildCriteria(key, value) {
  const filterWords = key.replace('filters.', '').split('.');
  const operand = _.last(filterWords);

  let op = '=';
  let containsOperand = false;
  let tmpValue = value;

  if (_.size(operand) <= 3) {
    switch (operand) {
      case 'eq':
        op = '=';
        containsOperand = true;
        break;
      case 'ne':
        op = '<>';
        containsOperand = true;
        break;
      case 'gt':
        op = '>';
        containsOperand = true;
        break;
      case 'ge':
        op = '>=';
        containsOperand = true;
        break;
      case 'lt':
        op = '<';
        containsOperand = true;
        break;
      case 'le':
        op = '<=';
        containsOperand = true;
        break;
      case 'in':
        op = 'in';
        tmpValue = selectFields(value);
        containsOperand = true;
        break;
      case 'nin':
        op = 'not in';
        tmpValue = selectFields(value);
        containsOperand = true;
        break;
      case 'lk':
        op = 'ilike';
        tmpValue = `%${value}%`;
        containsOperand = true;
        break;
      default:
        break;
    }
  }

  const field = containsOperand
    ? _.slice(filterWords, 0, filterWords.length - 1).join('.')
    : filterWords.join('.');

  const criteria = {
    field,
    criteria: op,
    value: tmpValue,
  };
  return criteria;
}

const parseQueryString = queryString => {
  const params = [];

  // Split into key/value pairs
  const queries = _.compact(queryString.split('&'));
  // Convert the array of strings into an object
  _.each(queries, query => {
    const splitBy = query.split('=');
    if (_.size(splitBy) === 2) {
      params.push({
        key: decodeURIComponent(splitBy[0]),
        value: decodeURIComponent(splitBy[1]),
      });
    }
  });
  return params;
};
exports.parseQueryString = parseQueryString;

exports.fetchFilterCriteria = (query, isAdmin = false) => {
  Logger.info(
    'dbUtil.fetchFilterCriteria - entry : filters received - ',
    query,
  );
  Logger.info('isAdmin', isAdmin);

  let returnVal = [];
  if (!_.isEmpty(query)) {
    try {
      const tryFilterAsString = parseQueryString(query);
      _.each(tryFilterAsString, hash =>
        returnVal.push(buildCriteria(hash.key, hash.value)),
      );
    } catch (err) {
      Logger.warn(
        'dbUtil.fetchFilterCriteria - failed to parse filter :; ',
        query,
      );
      throw err;
    }
  }

  const hasActiveFlag = _.find(returnVal, ['field', 'isActive']);
  const applyActiveFilter = !isAdmin || (isAdmin && !hasActiveFlag);
  Logger.info('dbUtil.fetchFilterCriteria - returnVal :: ', returnVal);
  Logger.info(' hasActiveFlag :: ', hasActiveFlag);
  Logger.info(' applyActiveFilter :: ', applyActiveFilter);

  if (applyActiveFilter) {
    returnVal = _.reject(returnVal, hash => hash.field === 'isActive');
    returnVal.push(buildCriteria('condition', 'AND'));
    returnVal.push(buildCriteria('isActive', 'true'));
  }
  Logger.info('dbUtil.fetchFilterCriteria - returnVal :: ', returnVal);
  return _.compact(returnVal);
};

const recursiveIteration = object => {
  const str = [];

  // for (const prop in object) {
  _.each(_.keys(object), prop => {
    let value = prop;
    if (object[prop] && typeof object[prop] === 'object') {
      const t = recursiveIteration(object[prop]);
      if (object[prop]) {
        value = `${prop}.[${t.join(',')}]`;
      }
      str.push(value);
    }
  });
  return str;
};

exports.prepareProjection = str => {
  const hash = {};
  const strArray = _.words(str, /[^, ]+/g);

  _.each(strArray, key => _.set(hash, key, null));

  const t = recursiveIteration(hash);
  const result = t.join(',');
  return result;
};

exports.splitByConditionsField = columns => {
  const keys = _.map(columns, 'field');
  let allIndexes = [0, _.size(columns)];

  _.each(keys, (val, index) => {
    if (val === 'condition') {
      allIndexes.push(index);
    }
  });

  allIndexes = _.uniq(allIndexes).sort((a, b) => a - b);

  const values = [];
  _.each(allIndexes, (val, index) => {
    if (val !== _.size(columns)) {
      values.push(_.slice(columns, val, allIndexes[index + 1]));
    }
  });

  return _.compact(values);
};
