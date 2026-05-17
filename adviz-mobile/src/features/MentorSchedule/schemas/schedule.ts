import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeRangeSchema = z.object({
  start_time: z.string().regex(timeRegex, 'Invalid time'),
  end_time: z.string().regex(timeRegex, 'Invalid time'),
}).refine((d) => d.start_time < d.end_time, { message: 'End must be after start', path: ['end_time'] });

export const dayTemplateSchema = z.object({
  weekday: z.number().min(0).max(6),
  ranges: z.array(timeRangeSchema),
  timezone: z.string(),
  enabled: z.boolean(),
});

export function detectOverlaps(ranges: { start_time: string; end_time: string }[]): string | null {
  const sorted = [...ranges].sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.end_time > b.start_time) {
      const overlapEnd = a.end_time < b.end_time ? a.end_time : b.end_time;
      return `${b.start_time}–${overlapEnd}`;
    }
  }
  return null;
}
