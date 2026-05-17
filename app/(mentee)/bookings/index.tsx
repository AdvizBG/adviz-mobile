import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PillTabs } from '../../../src/components/ui/PillTabs';
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

  const active = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled;

  const HEADER_HEIGHT = insets.top + 58 + 52 + 16;
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <View className="flex-1 bg-cream">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#FAF7F2' }}>
        <Text style={{ fontSize: 26, letterSpacing: 1, color: '#1B1B43' }}>{t('mentee.bookings.title')}</Text>
        <View className="mt-3">
          <PillTabs
            tabs={[
              { key: 'upcoming', label: t('mentee.bookings.tab_upcoming'), count: upcoming.length },
              { key: 'past', label: t('mentee.bookings.tab_past'), count: past.length },
              { key: 'cancelled', label: t('mentee.bookings.tab_cancelled'), count: cancelled.length },
            ]}
            activeKey={tab}
            onSelect={(k) => setTab(k as Tab)}
          />
        </View>
      </View>

      <FlatList
        data={active}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: TAB_HEIGHT + 8, paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <BookingRow
            session={item}
            mentorName="Ментор"
            onPrimary={() => router.push(`/(mentee)/bookings/${item.id}` as never)}
            onCancel={item.status === 'scheduled' ? () => setCancelSession(item) : undefined}
          />
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <View className="w-28 h-28 rounded-3xl bg-purple-100 items-center justify-center">
              <Text style={{ fontSize: 48 }}>📅</Text>
            </View>
            <Text className="text-[20px] font-light text-ink mt-4">{t('mentee.bookings.empty_title')}</Text>
            <TouchableOpacity onPress={() => router.replace('/(mentee)/browse' as never)} className="mt-4 px-6 py-3 rounded-2xl bg-purple-deep">
              <Text className="text-white font-semibold">{t('mentee.bookings.empty_cta')}</Text>
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
