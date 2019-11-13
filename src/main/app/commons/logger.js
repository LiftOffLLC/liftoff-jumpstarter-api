const {
  createLogger,
  format: { splat, simple, combine, colorize, timestamp },
  transports,
} = require('winston');

const logger = createLogger({
  level: 'info',
  format: combine(colorize(), timestamp(), splat(), simple()),
  transports: [new transports.Console()],
});
module.exports = logger;
