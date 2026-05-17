import { View, Text } from 'react-native';
import type { SessionStatus } from '../../lib/types';

const CONFIG: Record<SessionStatus, { label: string; bg: string; text: string; dot?: boolean }> = {
  scheduled: { label: 'SCHEDULED', bg: '#E0E0FF', text: '#3E1D87' },
  live: { label: 'LIVE', bg: 'rgba(254,91,82,0.10)', text: '#FE5B52', dot: true },
  completed: { label: 'COMPLETED', bg: '#D1FAE5', text: '#065F46' },
  cancelled: { label: 'CANCELLED', bg: '#F1F5F9', text: 'rgba(27,27,67,0.50)' },
  no_show: { label: 'NO SHOW', bg: '#F1F5F9', text: 'rgba(27,27,67,0.50)' },
};

export function SessionBadge({ status }: { status: SessionStatus }) {
  const c = CONFIG[status];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: c.bg }}>
      {c.dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.text }} />}
      <Text style={{ fontSize: 10.5, fontWeight: '600', color: c.text }}>{c.label}</Text>
    </View>
  );
}
