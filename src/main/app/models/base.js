/* eslint-disable class-methods-use-this */
import Checkit from 'checkit';
import _ from 'lodash';
import Promise from 'bluebird';
import knexClass from 'knex';
import Logger from 'winston';
import Config from '../../config';
import dbUtil from '../commons/dbUtil';

const Model = require('objection').Model;

const dbConfig = Config.get('database').get('postgres').toJS();
const knex = knexClass(dbConfig);
Model.knex(knex);

const defaultSortField = 'updatedAt';
const defaultSortOrder = 'desc';

const setMiscAttributes = (queryBuilder, criteria = {}, isAssnQuery = false) => {
  if (criteria.offset) {
    queryBuilder.offset(criteria.offset);
  }

  // for time-being skip limit, on associationQueries
  if (!isAssnQuery && criteria.limit) {
    queryBuilder.limit(criteria.limit);
  }

  // Optimization:: No Point applying sort criteria if limit is 1.
  // Postgres uses sorting logic before applying index.
  // apply sorting if its assoicationQuery.
  const applySort = isAssnQuery || (!criteria.limit) || (Number(criteria.limit) > 1);
  if (applySort) {
    const sortField = criteria.sortField || defaultSortField;
    const sortOrder = criteria.sortOrder || defaultSortOrder;

    const sortF = _.compact(_.words(sortField, /[^, ]+/g));
    const sortO = _.compact(_.words(sortOrder, /[^, ]+/g));
    const sortMapping = _.zipObject(sortF, sortO);

    for (const key of _.keys(sortMapping)) {
      queryBuilder.orderBy(key, sortMapping[key] || 'desc');
    }
  }
};


/**
Base model for database.
*/
export default class BaseModel extends Model {
  static validatorRules() {
    return {};
  }

  static buildCriteriaWithObject(option) {
    return _.map(option, (value, key) => this.buildCriteria(key, value));
  }

  static buildCriteria(field, value, criteria = '=') {
    return {
      field,
      criteria,
      value
    };
  }

  /**
  Place holder for all the validation rules applied at model level.
  */
  validations() {
    return {};
  }

  /**
  // https://github.com/Vincit/objection.js/issues/113
  pre-create hooks defined by Objection.js
  */
  // eslint-disable-next-line no-unused-vars
  $beforeInsert(opt, queryContext) {
    this.createdAt = this.updatedAt = new Date().toISOString();
    this.presaveHook();
    return this.$validateHook();
  }

  /**
  pre-save hooks defined by Objection.js
  */
  // eslint-disable-next-line no-unused-vars
  $beforeUpdate(opt, queryContext) {
    this.updatedAt = new Date().toISOString();
    this.presaveHook();
    return Promise.all([this.$validateHook()]);
  }

  async statsField() {
    return null;
  }

  /*
  Role based entities filters, These entities/properties will be omitted from the final response.
  */
  static entityFilteringScope() {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  async $afterGet(queryContext) {
    const statsFields = await this.statsField();
    if (statsFields) {
      const stats = {
        ___VOTES_META: {
          objectType: statsFields.objectType,
          objectId: this.id,
          voteTypes: statsFields.voteTypes,
          computedVoteTypes: statsFields.computedVoteTypes || []
        }
      };

      this.stats = stats;
    }

    // Add Prop_filtering_scope.
    const propFilterScope = this.constructor.entityFilteringScope();
    if (propFilterScope) {
      this.ENTITY_FILTERING_SCOPE = propFilterScope;
    }
  }

  /**
  placeholder hook for handling pre-create/save.
  */
  presaveHook() {
    // DO NOTHING..
  }

  /**
  placeholder hook for running validations rules.
  */
  $validateHook() {
    return new Checkit(this.validations()).run(this);
  }

  static async createOrUpdate(model, fetchById = true) {
    const models = _.isArray(model) ? _.cloneDeep(model) : [_.cloneDeep(model)];

    // remove stats object...if this is model has stats...
    _.each(models, (body) => {
      delete body.stats; // eslint-disable-line no-param-reassign
      delete body.ENTITY_FILTERING_SCOPE; // eslint-disable-line no-param-reassign
    });

    // See if any of the array has id field, if no bulk insert and return.
    if (!_.find(models, 'id')) {
      // if its single object, return single object, else array.
      return await this.query().insertAndFetch(_.cloneDeep(model));
    }

    // If it comes here, implies that it has id fields. and its okay to insert/update individually.
    const addedIds = [];
    for (const body of models) {
      if (body.id) {
        await this.query().update(body).where('id', body.id);
        addedIds.push(body.id);
      } else {
        const newObj = await this.query().insert(body);
        addedIds.push(newObj.id);
      }
    }

    if (fetchById === true) {
      // if its single object, return single object, else array.
      if (_.isArray(model)) {
        return await this.findAll(this.buildCriteria('id', addedIds, 'in'));
      }
      return await this.findOne(this.buildCriteria('id', _.head(addedIds)));
    }
    return true;
  }

  static async findOne(filters = {}, options = {}) {
    const tmpOptions = _.cloneDeep(options);
    tmpOptions.limit = 1;
    return await this.findAll(filters, tmpOptions).then(records => _.head(records));
  }

  static async deleteAll(filters = {}, hardDeleteFlag = true) {
    const inactive = {
      isActive: false
    };

    const records = await this.findAll(filters, _.zipObject(['columns'], ['id']));
    if (!_.isEmpty(records)) {
      if (hardDeleteFlag === true) {
        await this.query().delete().whereIn('id', _.map(records, 'id'));
      } else {
        await this.query().patch(inactive).whereIn('id', _.map(records, 'id'));
      }
    }
    return true;
  }

  static async count(filters = {}) {
    return await this.findAll(filters, _.zipObject(['columns', 'skipMiscFields'], ['id', true])).then(records => records.length);
  }

  static async findAll(filters = {}, options = {}) {
    const filterOpts = _.isArray(filters) ? _.cloneDeep(filters) : [_.cloneDeep(filters)];

    const activeCriteria = _.find(filterOpts, _.zipObject(['field'], ['isActive']));
    const activeValues = activeCriteria ? activeCriteria.value : [true];

    // Update isActive criteria, if its missing from the filters.
    if (!activeCriteria) {
      filterOpts.push(this.buildCriteria('condition', 'AND', ''));
      filterOpts.push(this.buildCriteria('isActive', [true], 'in'));
    }

    // Flag to Skip Misc Fields like sortBy.., limit and offset
    const skipMiscFields = options.skipMiscFields === true;
    _.set(options, 'skipMiscFields', null);
    const optionOpts = dbUtil.buildOptions(filterOpts, _.cloneDeep(options));

    Logger.info('base.findAll :: optionOpts :: ', optionOpts);
    Logger.info('base.findAll :: filterOpts :: ', filterOpts);
    const qb = this.query();

    // First deal with top-most table
    const tableCriteria = _.get(optionOpts, '_') || {};
    qb.columns(tableCriteria.columns || '*');
    if (skipMiscFields === false) {
      setMiscAttributes(qb, tableCriteria);
    }

    const conditionArray = dbUtil.splitByConditionsField(tableCriteria.filters);
    for (const condCriteria of conditionArray) {
      qb.where((builder) => {
        // figure out which operator to apply for this block, based on condition field and value.
        const conditionOp = _.find(condCriteria, _.zipObject(['field'], ['condition']));
        const condition = (conditionOp && _.toLower(conditionOp.value) === 'or') ? 'OR' : 'AND';
        // knock off condition criteria hash.
        const tmpCondCriteria = _.reject(condCriteria, hash => hash.field === 'condition');

        for (const hash of tmpCondCriteria) {
          if (condition === 'AND') {
            builder.where(hash.field, hash.criteria, hash.value);
          } else {
            builder.orWhere(hash.field, hash.criteria, hash.value);
          }
        }
      });
    }

    // Deal with all eager joins and associations.
    const columns = _.without(_.keys(optionOpts), '_');
    // TODO: BALL GAME CHANGES THE MOMENT LIMIT COMES INTO PICTURE...HANDLE IT.
    if (!_.isEmpty(columns)) {
      qb.eager(dbUtil.getEagerColumnString(columns));

      for (const childKey of columns) {
        const childCriteria = optionOpts[childKey];

        qb.filterEager(childKey, (builder) => {
          builder.columns(childCriteria.columns);
          builder.whereIn('isActive', activeValues);
          setMiscAttributes(builder, childCriteria, true);
        });
      }
    }

    Logger.info('base.findAll :: sql generated::', qb.toSql());
    return await qb;
  }
}
