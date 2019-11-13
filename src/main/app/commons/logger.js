const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  colorize: true,
  timestamp: true,
  format: winston.format.prettyPrint(),
  transports: [new winston.transports.Console()],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

module.exports = logger;
