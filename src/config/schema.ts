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

const CacheConfigSchema = z.object({
  enabled: z.boolean(),
});

const BulkConfigSchema = z.object({
  maxOrders: z.number().min(1).max(100),
  concurrency: z.number().min(1).max(50),
});

const AuthConfigSchema = z.object({
  jwtSecret: z.string().min(16),
  jwtExpiresInHours: z.number().min(1).max(720),
  bcryptSaltRounds: z.number().min(10).max(15),
});

const CourierRetryConfigSchema = z.object({
  timeoutMs: z.number().min(1000),
  retryCount: z.number().min(0).max(10),
  retryBackoffMs: z.number().min(100),
});

const UrbaneBoltConfigSchema = CourierRetryConfigSchema.extend({
  enabled: z.boolean(),
  baseUrl: z.string().url(),
  username: z.string(),
  password: z.string(),
  customerCode: z.string(),
  csrfToken: z.string().optional(),
  sessionId: z.string().optional(),
});

const MockCourierConfigSchema = z.object({
  enabled: z.boolean(),
  simulatedDelayMs: z.number().min(0),
});

const CouriersConfigSchema = z.object({
  urbanebolt: UrbaneBoltConfigSchema,
  mock: MockCourierConfigSchema,
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
  cache: CacheConfigSchema,
  mysql: z.object({
    primary: MysqlConfigSchema,
    replica: MysqlConfigSchema,
  }),
  redis: RedisConfigSchema,
  bulk: BulkConfigSchema,
  auth: AuthConfigSchema,
  couriers: CouriersConfigSchema,
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type MysqlConfig = z.infer<typeof MysqlConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type UrbaneBoltConfig = z.infer<typeof UrbaneBoltConfigSchema>;
export type MockCourierConfig = z.infer<typeof MockCourierConfigSchema>;
export type BulkConfig = z.infer<typeof BulkConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export { AppConfigSchema };
