import { z } from 'zod';

export const profileSchema = z.object({
  headline: z.string().min(10, 'Min 10 chars').max(120),
  about: z.string().min(50, 'Min 50 chars').max(1000),
  topics: z.array(z.string()).min(1).max(5),
  languages: z.array(z.string()).min(1),
  hourly_price_eur: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price'),
});

export type ProfileInput = z.infer<typeof profileSchema>;
