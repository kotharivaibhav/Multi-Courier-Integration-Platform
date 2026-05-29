import { newApp } from '../bootstrap/app';

export async function startServer(): Promise<void> {
  try {
    const app = newApp();
    await app.init();
    await app.runHttpServer();
    const ctx = app.getContext();
    ctx.logger.info('Application started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
