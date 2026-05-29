import { z } from 'zod';

const MysqlConfigSchema = z.object({
  host: z.string(),
  port: z.string(),
  username: z.string(),
  password: z.string(),
  db_name: z.string(),
  connectionLimit: z.number().max(100),
  poolTimeout: z.number(),
  connectTimeout: z.number(),
});

const RedisConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  password: z.string(),
  db: z.number().min(0).max(15),
});

const AppConfigSchema = z.object({
  service: z.object({
    env: z.string(),
    name: z.string(),
    shutdown_timeout: z.number(),
    before_shutdown_delay: z.number(),
  }),
  http: z.object({
    port: z.string(),
  }),
  logging: z.object({
    level: z.string(),
  }),
  mysql: z.object({
    primary: MysqlConfigSchema,
    replica: MysqlConfigSchema,
  }),
  redis: RedisConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type MysqlConfig = z.infer<typeof MysqlConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;

export { AppConfigSchema };
