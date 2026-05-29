import { createExpressApp } from './serverApp';
import { createServer } from 'node:http';
import { createTerminus } from '@godaddy/terminus';
import { AppContext } from '../bootstrap/app-context';
import { App } from '../bootstrap/app';

export async function runHttpServer(app: App, ctx: AppContext): Promise<void> {
  ctx.logger.info('Starting HTTP server');

  const expressApp = createExpressApp(ctx);
  const server = createServer(expressApp);

  createTerminus(server, {
    timeout: ctx.config.service.shutdown_timeout,
    signals: ['SIGTERM', 'SIGINT', 'SIGQUIT'],
    healthChecks: {
      '/api/v1/health': () => Promise.resolve('OK'),
    },
    onSignal: async () => {
      ctx.logger.info('Graceful shutdown initiated');
      await app.shutdown();
    },
    beforeShutdown: async () => {
      ctx.logger.info('Preparing for shutdown...');
      return new Promise((resolve) =>
        setTimeout(resolve, ctx.config.service.before_shutdown_delay),
      );
    },
    onShutdown: async () => {
      ctx.logger.info('Graceful shutdown completed');
    },
    logger: (msg: string, err?: Error) => {
      if (err) {
        ctx.logger.info(err, msg);
      } else {
        ctx.logger.info(msg);
      }
    },
  });

  server.listen(ctx.config.http.port, () => {
    ctx.logger.info(
      `Server running on port ${ctx.config.http.port} in ${ctx.config.service.env} mode`,
    );
  });

  return new Promise((resolve) => {
    server.on('listening', () => resolve(undefined));
  });
}
