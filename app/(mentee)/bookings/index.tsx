import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BookingRow } from '../../../src/features/Sessions/components/booking-row';
import { CancelSheet } from '../../../src/features/Sessions/components/cancel-sheet';
import { ReviewSheet } from '../../../src/features/Sessions/components/review-sheet';
import { useMySessions } from '../../../src/features/Sessions/api/hooks';
import type { SessionRead } from '../../../src/lib/types';

type Tab = 'upcoming' | 'past' | 'cancelled';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: sessions = [] } = useMySessions();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [cancelSession, setCancelSession] = useState<SessionRead | null>(null);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);

  const upcoming = sessions.filter((s) => s.status === 'scheduled' || s.status === 'live');
  const past = sessions.filter((s) => s.status === 'completed');
  const cancelled = sessions.filter((s) => s.status === 'cancelled' || s.status === 'no_show');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: t('mentee.bookings.tab_upcoming'), count: upcoming.length },
    { key: 'past', label: t('mentee.bookings.tab_past'), count: past.length },
    { key: 'cancelled', label: t('mentee.bookings.tab_cancelled'), count: cancelled.length },
  ];

  const activeData = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled;

  const HEADER_HEIGHT = insets.top + 58 + 52 + 16;
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#FAF7F2' }}>
        <Text style={{ fontSize: 26, letterSpacing: 1, color: '#1B1B43' }}>{t('mentee.bookings.title')}</Text>
        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(203,203,255,0.5)', borderRadius: 999, padding: 4, gap: 4 }}>
            {tabs.map((item) => {
              const active = item.key === tab;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999, backgroundColor: active ? '#FFFFFF' : 'transparent' }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '600', color: active ? '#3E1D87' : 'rgba(27,27,67,0.55)' }}>
                    {item.label} {item.count}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: TAB_HEIGHT + 8, paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <BookingRow
            session={item}
            onPrimary={() => router.push(`/(mentee)/bookings/${item.id}` as never)}
            onCancel={item.status === 'scheduled' && new Date(item.scheduled_start) > new Date() ? () => setCancelSession(item) : undefined}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 64 }}>
            <View style={{ width: 112, height: 112, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 48 }}>📅</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '300', color: '#1B1B43', marginTop: 16 }}>{t('mentee.bookings.empty_title')}</Text>
            <TouchableOpacity
              style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, backgroundColor: '#3E1D87' }}
              onPress={() => router.replace('/(mentee)/browse' as never)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t('mentee.bookings.empty_cta')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {cancelSession && (
        <CancelSheet session={cancelSession} visible onDismiss={() => setCancelSession(null)} />
      )}
      {reviewSessionId && (
        <ReviewSheet sessionId={reviewSessionId} visible onDismiss={() => setReviewSessionId(null)} />
      )}
    </View>
  );
}
