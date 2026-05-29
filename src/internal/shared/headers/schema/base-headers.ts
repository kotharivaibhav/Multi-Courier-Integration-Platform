import { z } from 'zod';

export const BaseHeadersSchema = z.object({
  'x-request-id': z.string(),
  'content-type': z.string().optional(),
  'user-agent': z.string().optional(),
});

export type BaseHeaders = z.infer<typeof BaseHeadersSchema>;
