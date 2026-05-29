import { startServer } from './commands/server';
import dotenv from 'dotenv';

async function main(): Promise<void> {
  dotenv.config();
  await startServer();
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
