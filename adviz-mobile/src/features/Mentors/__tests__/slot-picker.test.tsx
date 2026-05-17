import React from 'react';
import { render } from '@testing-library/react-native';
import { SlotPicker } from '../components/slot-picker';
import { createQueryWrapper } from '../../../lib/__tests__/test-utils';

jest.mock('../api/hooks', () => ({
  useMentorAvailability: () => ({ data: [] }),
}));

test('renders timezone notice', () => {
  const { getByText } = render(
    <SlotPicker mentorId="m1" onSelect={jest.fn()} selectedSlot={null} />,
    { wrapper: createQueryWrapper() }
  );
  expect(getByText(/Times shown in your local time/)).toBeTruthy();
});
