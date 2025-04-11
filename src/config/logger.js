const winston = require('winston');
const moment = require('moment');
const config = require('./env');

const logger = winston.createLogger({
  level: config.get('env') === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().format('DD-MM-YYYY hh:mm:ss A'), // Custom format: dd-mm-yyyy hh:mm:ss am/pm
    }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (config.get('env') !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;