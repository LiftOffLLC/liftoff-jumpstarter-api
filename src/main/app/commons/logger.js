const { createLogger, format, transports } = require('winston');
const hasAnsi = require('has-ansi');
const Util = require('util');
const { combine, colorize, timestamp, printf, errors } = format;
const { inspect } = Util;

const isPrimitive = val =>
  val === null || (typeof val !== 'object' && typeof val !== 'function');

const formatWithInspect = val => {
  if (val instanceof Error) {
    return '';
  }

  const prefix = isPrimitive(val) ? '' : '\n';
  const shouldFormat = typeof val !== 'string' || !hasAnsi(val);

  return (
    prefix + (shouldFormat ? inspect(val, { depth: null, colors: true }) : val)
  );
};

const logFormat = combine(
  format(info => {
    info.level = info.level.toUpperCase();
    return info;
  })(),
  timestamp(),
  errors({ stack: true }),
  colorize({ all: true }),
  printf(info => {
    const msg = formatWithInspect(info.message);
    const splatArgs = info[Symbol.for('splat')] || [];
    const rest = splatArgs.map(data => formatWithInspect(data)).join(' ');
    const stackTrace = info.stack ? `\n${info.stack}` : ''; // TODO: This is hacky, revisit

    return `${info.timestamp} - ${info.level}: ${msg} ${rest}${stackTrace}`;
  }),
);

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [new transports.Console()],
});
module.exports = logger;
