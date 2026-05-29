import { existsSync, readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { resolve } from 'path';
import { type AppConfig, AppConfigSchema } from './schema';
import * as constants from './constants';

export function loadConfig(): AppConfig {
  const configPath = resolve(constants.CONFIG_PATH);

  try {
    if (!existsSync(configPath)) {
      console.error('Config file not found:', configPath);
      process.exit(1);
    }

    const fileContents = readFileSync(configPath, 'utf8');
    const parsedConfig = load(fileContents);

    const result = AppConfigSchema.safeParse(parsedConfig);

    if (!result.success) {
      console.error('Configuration validation failed:');
      result.error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }

    console.log('Configuration loaded and validated successfully');
    return result.data;
  } catch (error) {
    console.error('Failed to load config:', error);
    process.exit(1);
  }
}

export type { AppConfig, MysqlConfig } from './schema';
