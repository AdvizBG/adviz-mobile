import React from 'react';
import { render } from '@testing-library/react-native';
import { MentorCard } from '../components/mentor-card';

const mentor = {
  id: 'm1', user_id: 'u1', status: 'active' as const,
  headline: 'Senior Engineer', about: '', topics: ['React', 'Node.js', 'TypeScript'],
  languages: ['bg'], hourly_price_eur: '50.00', links: {}, stripe_account_id: null,
  total_sessions: 42, avg_rating: 4.8, since: '2024-01-01T00:00:00Z',
  full_name: 'Иван Петров',
};

test('renders mentor name and price', () => {
  const { getByText } = render(<MentorCard mentor={mentor} />);
  expect(getByText('Иван Петров')).toBeTruthy();
  expect(getByText('€50')).toBeTruthy();
});

test('shows first 3 topics', () => {
  const { getByText } = render(<MentorCard mentor={mentor} />);
  expect(getByText('React')).toBeTruthy();
  expect(getByText('Node.js')).toBeTruthy();
  expect(getByText('TypeScript')).toBeTruthy();
});
