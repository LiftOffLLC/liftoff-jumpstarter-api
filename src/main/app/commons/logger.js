import logger from 'winston';

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  level: 'debug', // (process.env.NODE_ENV === 'development') ? 'debug' : 'warn',
  colorize: true,
  timestamp: true
});

module.exports = logger;
