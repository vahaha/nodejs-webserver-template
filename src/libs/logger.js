const winston = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const path = require('path')
const { format } = winston

const {LOG_PATH} = process.env

const logPath = LOG_PATH || path.join(__dirname, '../..', 'logs')

const logger = winston.createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    defaultMeta: { service: 'user-service' },
    //     transports: [
    //     //
    //     // - Write all logs with level `error` and below to `error.log`
    //     // - Write all logs with level `info` and below to `combined.log`
    //     //
    //     new winston.transports.File({ filename: '/tmp/error.log', level: 'error', 'timestamp':true }),
    //     new winston.transports.File({ filename: '/tmp/warn.log', level: 'warn', 'timestamp':true }),
    //     // new winston.transports.File({ filename: 'combined.log' }),
    //   ],
})

logger.configure({
    level: 'info',
    transports: [
        new DailyRotateFile({
            filename: path.join(logPath, 'omni-%DATE%.error.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error',
        }),
        new DailyRotateFile({
            filename: path.join(logPath,'omni-%DATE%.warn.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'warn',
        }),
        new DailyRotateFile({
            filename: path.join(logPath, 'omni-%DATE%.info.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info',
        }),
    ],
})

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: winston.format.simple(),
//   }));
// }

module.exports = logger
