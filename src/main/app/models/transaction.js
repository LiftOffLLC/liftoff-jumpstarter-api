/* eslint-disable class-methods-use-this,newline-per-chained-call */
const BaseModel = require('./base');

module.exports = class Transaction extends BaseModel {
  static get tableName() {
    return 'Transaction';
  }

  static entityFilteringScope() {
    const omitFields = ['isActive'];
    return {
      admin: omitFields,
      user: omitFields,
      guest: omitFields,
    };
  }

  static status() {
    return {
      SUCCESSFUL: 'successful',
      NEEDS_ACTION: 'needs-action',
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'Transaction.userId',
          to: 'User.id',
        },
      },
    };
  }
};
