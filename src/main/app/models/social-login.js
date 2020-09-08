const BaseModel = require('./base');

module.exports = class SocialLogin extends BaseModel {
  static get tableName() {
    return 'SocialLogin';
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
          from: 'SocialLogin.userId',
          to: 'User.id',
        },
      },
    };
  }
};
