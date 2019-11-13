const { createLogger, format, transports } = require('winston');
const { splat, simple, combine, colorize, timestamp, json } = format;

const logFormat = combine(
  format(info => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  colorize({ all: true }),
  timestamp(),
  simple(),
  splat(),
  json(),
  simple(),
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [new transports.Console()],
});
module.exports = logger;
