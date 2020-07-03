/* eslint-disable import/first */
require('dotenv').config();
const _ = require('lodash');
const CatboxRedis = require('@hapi/catbox-redis');
const path = require('path');
const token = require('../app/commons/token');
const errorParser = require('../app/commons/error.parser');
const env = process.env.NODE_ENV;
const urlParser = require('../app/commons/url_parser');

// replace REDIS_URL with the appropriate variable provided by your redis provider on heroku
const redisConfig = _.pick(urlParser(process.env.REDIS_URL), [
  'host',
  'port',
  'password',
]);

module.exports = {
  // env info
  env,
  // Server options used to start Hapi server
  server: {
    name: 'Liftoff Jumpstart v2.1 Server',
    version: '2.1.0',
    host: process.env.HOST,
    port: parseInt(process.env.PORT, 10),
    forceSSL: process.env.FORCE_SSL,
    cache: [
      {
        name: 'redis-cache',
        provider: {
          _constructor: CatboxRedis,
          options: {
            ...redisConfig,
            partition: 'cache',
          },
        },
      },
    ],
    routes: {
      cors: true,
      state: {
        parse: false, // Parse content of req.headers.cookie
        failAction: 'ignore', // Action on bad cookie - 'error': return 400, 'log': log and continue, 'ignore': continue
      },
      validate: {
        failAction: errorParser.parsePayloadErrors,
      },
    },
    startScheduler: process.env.START_SCHEDULER === 'true',
  },
  // NewRelic Config
  newrelic: {
    name: `Liftoff Jumpstart v2.1 Server -  ${env}`,
    key: process.env.NEW_RELIC_LICENSE_KEY,
    log_level: process.env.NEW_RELIC_LOG_LEVEL,
  },
  // Database, currently we have postgres only,
  // mongo will be added later and redis is used for cache.
  database: {
    postgres: {
      client: 'postgresql',
      debug: true,
      recreateDatabase:
        env !== 'production' ? process.env.DB_RECREATE : 'false',
      // local-dev
      connection: {
        ...urlParser(process.env.DATABASE_URL),
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
      ...redisConfig,
    },
  },
  // auth-jwt strategy for sesssion.
  auth: {
    key: process.env.AUTH_JWT_KEY, // Never Share your secret key
    validate: token.validateToken, // validate function defined above
    verifyOptions: {
      ignoreExpiration: true, // do not reject expired tokens
      algorithms: ['HS256'], // pick a strong algorithm
    },
    signOptions: {
      expiresIn: '90d',
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
  webUrl: `${process.env.WEB_APP_URL}`,
  adminUrl: `${process.env.WEB_APP_URL}/admin`,
  countryCode: process.env.COUNTRY_CODE,
  country: process.env.COUNTRY,
  // Forgot password configureation
  passwordReset: {
    duration: 60 * 60 * 24 * 1000,
    tokenSecretkey: process.env.AUTH_JWT_PWD_KEY,
    forgotUrl: `${process.env.WEB_APP_URL}/password-reset`,
    fromEmail: process.env.SUPPORT_FROM_EMAIL,
  },
  // mailer configuration
  mailAddress: {
    name: 'Liftoff Jumpstart v2.1 Server',
    info: process.env.INFO_FROM_EMAIL,
    notifications: process.env.NOTIFICATIONS_FROM_EMAIL,
    support: process.env.SUPPORT_FROM_EMAIL,
  },
  mailer: {
    transport: process.env.DEFAULT_MAIL_SERVICE,
    sendgrid: {
      auth: {
        api_key: process.env.SENDGRID_API_KEY,
      },
    },
    // SES credentials
    ses: {
      package: 'nodemailer-ses-transport',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
    },
  },
  // worker config
  worker: {
    prefix: 'worker',
    redis: {
      name: 'liftoff-jumpstart-worker',
      ...redisConfig,
    },
  },
  model_cache: {
    cachedModels: _.split(process.env.CACHED_MODELS, ', ') || [],
    modelCacheDuration: parseInt(process.env.MODEL_CACHE_DURATION, 10),
    modelCacheTimeout: parseInt(process.env.MODEL_CACHE_TIMEOUT, 10),
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
    enabled: process.env.SENTRY_ENABLED === 'true',
  },
};
