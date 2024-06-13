import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const winstonLogger = winston.createLogger({
  format: combine(winston.format.colorize(), timestamp(), logFormat),
  transports: [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
      dirname: './logs',
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
});

export default winstonLogger;
