/* eslint-disable class-methods-use-this,newline-per-chained-call */
const Bcrypt = require('bcrypt');
const _ = require('lodash');
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const Uuid = require('node-uuid');
const Logger = require('../commons/logger');
const BaseModel = require('./base');
const UserRole = require('./userRole');
const RedisClient = require('../commons/redisClient');
const PhoneJoiValidator = require('../commons/validators/phoneJoiValidator');
const EmailBlackListValidator = require('../commons/validators/emailBlackListValidator');

module.exports = class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static entityFilteringScope() {
    return {
      admin: ['encryptedPassword', 'passwordSalt'],
      user: [
        'phoneToken',
        'isPhoneVerified',
        'emailToken',
        'isEmailVerified',
        'encryptedPassword',
        'passwordSalt',
        'resetPasswordToken',
        'resetPasswordSentAt',
      ],
      guest: [
        'phoneToken',
        'isPhoneVerified',
        'emailToken',
        'isEmailVerified',
        'encryptedPassword',
        'passwordSalt',
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
      password: Joi.string()
        .trim()
        .regex(/^[a-zA-Z0-9]{8,30}$/)
        .description('Password'),
      email: EmailBlackListValidator.email()
        .isBlacklisted()
        .description('Email'),
      phoneNumber: PhoneJoiValidator.phone()
        .e164format()
        .description('phone number'),
      isAdmin: Joi.boolean().default(false).description('Admin?'),
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
      this.isAdmin = false;
      this.userName = Uuid.v4();
    }

    this.hashPassword();
  }

  static get relationMappings() {
    return {
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
    if (this.encryptedPassword) {
      if (
        this.encryptedPassword.indexOf('$2b$') === 0 &&
        this.encryptedPassword.length === 60
      ) {
        // The password is already hashed. It can be the case when the instance is loaded from DB
        // eslint-disable-next-line no-self-assign
        this.encryptedPassword = this.encryptedPassword;
      } else {
        this.passwordSalt = Bcrypt.genSaltSync(10);
        this.encryptedPassword = this.encryptPassword(
          this.encryptedPassword,
          this.passwordSalt,
        );
      }
    }
    Logger.info('afteer hashPassword');
  }

  verifyPassword(password) {
    return Bcrypt.compareSync(password, this.encryptedPassword);
  }

  encryptPassword(pwd, passwordSalt) {
    return Bcrypt.hashSync(pwd, passwordSalt);
  }

  static async signSession(request, userId) {
    const user = await this.findOne(this.buildCriteria('id', userId), {
      columns: '*,socialLogins.*',
    });

    const sessionId = Uuid.v4();
    const session = await request.server.asyncMethods.sessionsAdd(sessionId, {
      id: sessionId,
      userId: user.id,
      isAdmin: user.isAdmin,
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
      user.isAdmin ? UserRole.ADMIN : UserRole.USER,
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
