import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { MCard } from '../MCard';
import { Eyebrow } from '../Eyebrow';
import { CTA } from '../CTA';
import { MAvatar } from '../MAvatar';

test('MCard renders children', () => {
  const { getByText } = render(<MCard><Text>Hello</Text></MCard>);
  expect(getByText('Hello')).toBeTruthy();
});

test('Eyebrow renders text', () => {
  const { getByText } = render(<Eyebrow>ТЕМИ</Eyebrow>);
  expect(getByText('ТЕМИ')).toBeTruthy();
});

test('CTA renders label', () => {
  const { getByText } = render(<CTA onPress={() => {}} label="Влез" />);
  expect(getByText('Влез')).toBeTruthy();
});

test('CTA disabled has reduced opacity', () => {
  const { getByTestId } = render(<CTA onPress={() => {}} label="Go" disabled testID="cta" />);
  const btn = getByTestId('cta');
  expect(btn.props.accessibilityState?.disabled).toBe(true);
});

test('MAvatar shows initials', () => {
  const { getByText } = render(<MAvatar initials="ИП" color="#CBCBFF" size={48} />);
  expect(getByText('ИП')).toBeTruthy();
});
