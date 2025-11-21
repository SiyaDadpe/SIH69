const logger = {
  info: (message, meta) => {
    console.log('[INFO]', message, meta || '');
  },
  warn: (message, meta) => {
    console.warn('[WARN]', message, meta || '');
  },
  error: (message, meta) => {
    console.error('[ERROR]', message, meta || '');
  },
  debug: (message, meta) => {
    console.log('[DEBUG]', message, meta || '');
  },
  http: (message, meta) => {
    console.log('[HTTP]', message, meta || '');
  }
};

logger.stream = {
  write: (message) => {
    console.log(message.trim());
  }
};

logger.logger = logger;

module.exports = logger;
module.exports.logger = logger;
module.exports.stream = logger.stream;
