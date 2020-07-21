/* eslint-disable class-methods-use-this,newline-per-chained-call */
const Bcrypt = require('bcrypt');
const _ = require('lodash');
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const Uuid = require('node-uuid');
const Logger = require('../commons/logger');
const BaseModel = require('./base');
const UserRoleEnum = require('./userRole').loginRoles();
const RedisClient = require('../commons/redisClient');
const Constants = require('../commons/constants');
const PhoneJoiValidator = require('../commons/validators/phoneJoiValidator');
const EmailBlackListValidator = require('../commons/validators/emailBlackListValidator');
const PasswordValidator = require('../commons/validators/password-validator');

module.exports = class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static entityFilteringScope() {
    return {
      admin: ['hashedPassword'],
      user: [
        'phoneToken',
        'isPhoneVerified',
        'emailToken',
        'isEmailVerified',
        'hashedPassword',
        'resetPasswordToken',
        'resetPasswordSentAt',
      ],
      guest: [
        'phoneToken',
        'isPhoneVerified',
        'emailToken',
        'isEmailVerified',
        'hashedPassword',
        'resetPasswordToken',
        'resetPasswordSentAt',
        'socialLogins',
      ],
    };
  }

  static validatorRules() {
    const rules = {
      id: Joi.number().integer().positive().description('User Id'),
      userName: Joi.string()
        .trim()
        .alphanum()
        .min(3)
        .max(30)
        .description('User Name'),
      name: Joi.string().trim().min(3).max(255).description('Name'),
      password: PasswordValidator.password().isValid().description('Password'),
      email: EmailBlackListValidator.email()
        .isBlacklisted()
        .description('Email'),
      phoneNumber: PhoneJoiValidator.phone()
        .e164format()
        .description('phone number'),
      accessToken: Joi.string().trim().description('Access token'),
      refreshToken: Joi.string().trim().description('Refresh token'),
      rawBody: Joi.string().description('raw social data'),
      resetPasswordToken: Joi.string()
        .trim()
        .uuid()
        .description('Reset password token'),
      avatarUrl: Joi.string().trim().description('Avatar URL'),
    };
    return rules;
  }

  presaveHook() {
    // if this is new object..
    if (!this.id) {
      this.userName = Uuid.v4();
    }

    this.hashPassword();
  }

  static get relationMappings() {
    return {
      role: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: `${__dirname}/userRole`,
        join: {
          from: 'users.roleId',
          to: 'user_roles.id',
        },
      },
      socialLogins: {
        relation: BaseModel.HasManyRelation,
        modelClass: `${__dirname}/socialLogin`,
        join: {
          from: 'users.id',
          to: 'social_logins.userId',
        },
      },
    };
  }

  hashPassword() {
    if (this.hashedPassword) {
      if (
        this.hashedPassword.indexOf('$2b$') === 0 &&
        this.hashedPassword.length === 60
      ) {
        // Don't know why this condition exists, please report if you figure out.
        // Following is a failed attempt of explanation
        // The password is already hashed. It can be the case when the instance is loaded from DB
        // eslint-disable-next-line no-self-assign
        this.hashedPassword = this.hashedPassword;
      } else {
        this.hashedPassword = this.getHashedPassword(this.hashedPassword);
      }
    }
    Logger.info('after hashPassword');
  }

  verifyPassword(password) {
    return Bcrypt.compareSync(password, this.hashedPassword);
  }

  getHashedPassword(password) {
    return Bcrypt.hashSync(password, 10);
  }

  static async signSession(request, userId) {
    const user = await this.findOne(this.buildCriteria('id', userId), {
      columns: '*,socialLogins.*',
    });

    const sessionId = Uuid.v4();
    const session = await request.server.asyncMethods.sessionsAdd(sessionId, {
      id: sessionId,
      userId: user.id,
      isAdmin: user.roleId === Constants.ROLES.ADMIN,
    });
    await RedisClient.saveSession(user.id, sessionId, session);
    const sessionToken = request.server.methods.sessionsSign(session);
    // Set Session Token for response.
    user.sessionToken = sessionToken;

    // allow entity filtering to happen here.
    _.set(request, 'auth.credentials.userId', user.id);
    _.set(
      request,
      'auth.credentials.scope',
      user.roleId === Constants.ROLES.ADMIN
        ? UserRoleEnum.ADMIN
        : UserRoleEnum.USER,
    );

    // HAck to send back the social access/refresh token to self
    if (user.socialLogins) {
      _.each(user.socialLogins, socialLog => {
        _.set(socialLog, '_accessToken', socialLog.accessToken);
        _.set(socialLog, '_refreshToken', socialLog.refreshToken);
      });
    }
    return user;
  }
};
