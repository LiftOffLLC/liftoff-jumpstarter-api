/* eslint-disable no-console */
const knexClass = require('knex');
const Config = require('./config');

const configureDatabase = async () => {
  try {
    const dbConfig = Config.get('database').get('postgres').toJS();
    const knex = knexClass(dbConfig);

    await knex.raw(dbConfig.validateQuery);

    if (dbConfig.recreateDatabase === 'true') {
      console.log(
        Date.now(),
        ':::: running database migration :::: started !!!',
      );

      await knex.migrate.rollback(dbConfig);
      await knex.migrate.latest(dbConfig);

      // Populate Seed Data
      await knex.seed.run(dbConfig);
      // Flush all Redis keys...
      // eslint-disable-next-line global-require
      const RedisClient = require('./app/commons/redisClient');

      await RedisClient.flushDB();
      console.log(Date.now(), ':::: running database migration :::: ended !!!');
    }
  } catch (e) {
    console.error('could not configure database: ', e);
    throw e;
  }
};

module.exports = configureDatabase;
