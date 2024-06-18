"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston = require("winston");
require("winston-daily-rotate-file");
var _a = winston.format, combine = _a.combine, timestamp = _a.timestamp, printf = _a.printf;
var logFormat = printf(function (_a) {
    var level = _a.level, message = _a.message, timestamp = _a.timestamp;
    return "".concat(timestamp, " [").concat(level, "]: ").concat(message);
});
var winstonLogger = winston.createLogger({
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
exports.default = winstonLogger;
