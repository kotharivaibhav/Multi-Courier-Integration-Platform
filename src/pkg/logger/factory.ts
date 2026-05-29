import pino from 'pino';
import { AppConfig } from '../../config';

export function initLogger(config: AppConfig): pino.Logger {
  return pino({
    level: config.logging?.level || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        service: config.service.name,
        env: config.service.env,
        hostname: bindings.hostname,
        pid: bindings.pid,
      }),
    },
    redact: {
      paths: ['password', 'token', 'apiKey', 'authorization', 'cookie'],
      censor: '[REDACTED]',
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  });
}
