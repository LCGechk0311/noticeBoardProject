import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import winstonLogger from './logger.middleware';

@Injectable()
export class CustomLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winstonLogger;
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace: string) {
    this.logger.error(message, { trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}