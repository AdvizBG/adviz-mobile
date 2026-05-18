import React from 'react';
import { render } from '@testing-library/react-native';
import { SessionBadge } from '../SessionBadge';

test.each([
  ['scheduled', 'SCHEDULED'],
  ['live', 'LIVE'],
  ['completed', 'COMPLETED'],
  ['cancelled', 'CANCELLED'],
  ['no_show', 'NO SHOW'],
] as const)('SessionBadge %s renders correct label', (status, expected) => {
  const { getByText } = render(<SessionBadge status={status} />);
  expect(getByText(expected)).toBeTruthy();
});
