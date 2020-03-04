const { createLogger, format, transports } = require('winston');
const { simple, combine, colorize, timestamp, json } = format;

const logFormat = combine(
  format(info => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  colorize({ all: true }),
  timestamp(),
  json(),
  simple(),
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [new transports.Console()],
});
module.exports = logger;
