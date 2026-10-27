const levels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const safeMeta = { ...meta };

  for (const key of Object.keys(safeMeta)) {
    if (/token|password|secret|authorization|cookie/i.test(key)) {
      safeMeta[key] = '[REDACTED]';
    }
  }

  const metaStr = Object.keys(safeMeta).length > 0 ? ` | ${JSON.stringify(safeMeta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.debug(formatMessage(levels.DEBUG, msg, meta));
    }
  },
  info: (msg, meta) => console.log(formatMessage(levels.INFO, msg, meta)),
  warn: (msg, meta) => console.warn(formatMessage(levels.WARN, msg, meta)),
  error: (msg, meta) => console.error(formatMessage(levels.ERROR, msg, meta))
};

module.exports = logger;
