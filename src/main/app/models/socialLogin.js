const BaseModel = require('./base');

module.exports = class SocialLogin extends BaseModel {
  static get tableName() {
    return 'social_logins';
  }

  static entityFilteringScope() {
    const omitFields = ['refreshToken', 'accessToken', 'rawBody'];
    return {
      admin: omitFields,
      user: omitFields,
      guest: omitFields,
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: `${__dirname}/user`,
        join: {
          from: 'social_logins.userId',
          to: 'users.id',
        },
      },
    };
  }
};
