import { detectOverlaps } from '../schemas/schedule';

test('no overlap returns null', () => {
  expect(detectOverlaps([
    { start_time: '09:00', end_time: '12:00' },
    { start_time: '13:00', end_time: '17:00' },
  ])).toBeNull();
});

test('overlapping ranges returns overlap range', () => {
  const result = detectOverlaps([
    { start_time: '09:00', end_time: '14:00' },
    { start_time: '13:00', end_time: '17:00' },
  ]);
  expect(result).toBe('13:00–14:00');
});

test('adjacent ranges (no gap) return null', () => {
  expect(detectOverlaps([
    { start_time: '09:00', end_time: '13:00' },
    { start_time: '13:00', end_time: '17:00' },
  ])).toBeNull();
});

test('single range returns null', () => {
  expect(detectOverlaps([{ start_time: '09:00', end_time: '12:00' }])).toBeNull();
});

test('empty array returns null', () => {
  expect(detectOverlaps([])).toBeNull();
});

test('a fully contains b returns overlap range', () => {
  const result = detectOverlaps([
    { start_time: '09:00', end_time: '17:00' },
    { start_time: '10:00', end_time: '12:00' },
  ]);
  expect(result).toBe('10:00–12:00');
});
