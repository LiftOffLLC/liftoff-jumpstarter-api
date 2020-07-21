const Joi = require('@hapi/joi');
const _ = require('lodash');
const BaseModel = require('./base');

module.exports = class UserRole extends BaseModel {
  static get tableName() {
    return 'user_roles';
  }

  static entityFilteringScope() {
    const omitFields = ['isActive', 'createdAt', 'updatedAt'];
    return {
      admin: omitFields,
      user: omitFields,
      guest: omitFields,
    };
  }

  static loginRoles() {
    return {
      ADMIN: 'admin',
      USER: 'user',
      GUEST: 'guest',
    };
  }

  static validatorRules() {
    const rules = {
      id: Joi.number().integer().positive(),
      name: Joi.string().trim().description('Role Name'),
      description: Joi.string().description('Role Description'),
    };
    return rules;
  }

  static get relationMappings() {
    return {
      users: {
        relation: BaseModel.HasManyRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'user_roles.id',
          to: 'users.roleId',
        },
      },
    };
  }

  static async getRoles() {
    const roles = await this.findAll(this.buildCriteriaWithObject({}));
    return _.zipObject(_.map(roles, 'name'), _.map(roles, 'id'));
  }
};
