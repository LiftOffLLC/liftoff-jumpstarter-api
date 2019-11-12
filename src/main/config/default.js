/* eslint-disable import/first */
require('dotenv').config();
import CatboxRedis from '@hapi/catbox-redis';
import path from 'path';
import token from '../app/commons/token';

const env = process.env.NODE_ENV || 'development';

export default {
  // env info
  env,
  // Server options used to start Hapi server
  server: {
    name: 'Liftoff Jumpstart v1.0 Server',
    version: '1.0.0',
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 3000,
    forceSSL: process.env.FORCE_SSL || 'false',
    cache: [
      {
        name: 'redis-cache',
        provider: {
          _constructor: CatboxRedis,
          options: {
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASS || '',
            partition: 'cache',
          },
        },
      },
    ],
  },
  // NewRelic Config
  newrelic: {
    name: `Liftoff Jumpstart v4.0 Server -  ${env}`,
    key: process.env.NEW_RELIC_LICENSE_KEY || 'XXX',
    log_level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  // Database, currently we have postgres only,
  // mongo will be added later and redis is used for cache.
  database: {
    postgres: {
      client: 'postgresql',
      debug: true,
      recreateDatabase:
        env !== 'production' ? process.env.DB_RECREATE || 'false' : 'false',
      // local-dev
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASS || 'password',
        database: process.env.DB_NAME || 'liftoff_dev',
        charset: 'utf8',
      },
      pool: {
        min: 2,
        max: 10,
      },
      validateQuery: 'SELECT 1',
      migrations: {
        directory: path.join(__dirname, '..', 'database', 'migrations'),
      },
      seeds: {
        directory: path.join(__dirname, '..', 'database', 'seeds', 'master'),
      },

      // IMPORTANT :: Commenting out acquireConnectionTimeout
      //    - https://github.com/tgriesser/knex/issues/1382#issuecomment-217020465
      // acquireConnectionTimeout: 10000
    },
    redis: {
      name: 'liftoff-jumpstart-cache',
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASS || false,
    },
  },
  // auth-jwt strategy for sesssion.
  auth: {
    key: process.env.AUTH_JWT_KEY || 'NeverShareYourSecret', // Never Share your secret key
    validateFunc: token.validateToken, // validate function defined above
    verifyOptions: {
      ignoreExpiration: true, // do not reject expired tokens
      algorithms: ['HS256'], // pick a strong algorithm
    },
    urlKey: false,
    cookieKey: false,
  },
  // social Credentils
  social: {
    facebook: {
      profileUrl: 'https://graph.facebook.com/me',
    },
    google: {
      profileUrl: 'https://www.googleapis.com/plus/v1/people/me',
    },
    instagram: {
      profileUrl: 'https://api.instagram.com/v1/users/self',
    },
  },
  webUrl: `${process.env.WEB_APP_URL || 'http://localhost:3000'}`,
  adminUrl: `${process.env.WEB_APP_URL || 'http://localhost:3000'}/admin`,
  countryCode: process.env.COUNTRY_CODE || '+91',
  country: process.env.COUNTRY || 'IN',
  // Forgot password configureation
  passwordReset: {
    duration: 60 * 60 * 24 * 1000,
    tokenSecretkey: process.env.AUTH_JWT_PWD_KEY || 'NeverShareYourSecret',
    forgotUrl: `${process.env.WEB_APP_URL ||
      'http://localhost:3000'}/password-reset`,
    fromEmail:
      process.env.SUPPORT_FROM_EMAIL || 'Support Team <support@dummy.com>',
  },
  // mailer configuration
  mailAddress: {
    info: process.env.INFO_FROM_EMAIL || 'Info <info@dummy.com>',
    notifications:
      process.env.NOTIFICATIONS_FROM_EMAIL ||
      'Notifications Team <notifications@dummy.com>',
    support:
      process.env.SUPPORT_FROM_EMAIL || 'Support Team <support@dummy.com>',
  },
  mailer: {
    transport: process.env.DEFAULT_MAIL_SERVICE || 'ses',
    sendgrid: {
      package: 'nodemailer-sendgrid-transport',
      auth: {
        api_key: process.env.SENDGRID_API_KEY || 'XXX',
      },
    },
    // SES credentials
    ses: {
      package: 'nodemailer-ses-transport',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID || 'XXX',
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY || 'XXX',
    },
  },
  // worker config
  worker: {
    prefix: 'worker',
    redis: {
      name: 'liftoff-jumpstart-worker',
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      // password: process.env.REDIS_PASS || false,
      // no_ready_check: true,
      auth: process.env.REDIS_PASS || false,
    },
  },
};
