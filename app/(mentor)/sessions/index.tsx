import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { PillTabs } from '../../../src/components/ui/PillTabs';
import { MentorSessionRow } from '../../../src/features/MentorSessions/components/mentor-session-row';
import { useMentorSessions, useStartSession, useEndSession } from '../../../src/features/Sessions/api/hooks';
import { useAuthStore } from '../../../src/store/auth';
import type { SessionStatus } from '../../../src/lib/types';

type Tab = 'upcoming' | 'past' | 'cancelled';

const TAB_STATUS: Record<Tab, SessionStatus[]> = {
  upcoming: ['scheduled', 'live'],
  past: ['completed'],
  cancelled: ['cancelled', 'no_show'],
};

export default function MentorSessionsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: sessions = [] } = useMentorSessions();
  const startSession = useStartSession();
  const endSession = useEndSession();
  const [tab, setTab] = useState<Tab>('upcoming');

  const filtered = sessions.filter((s) => TAB_STATUS[tab].includes(s.status));
  const HEADER_HEIGHT = insets.top + 58 + 52;
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  function handleAction(sessionId: string, status: SessionStatus) {
    if (status === 'live') endSession.mutate(sessionId);
    else if (status === 'scheduled') startSession.mutate(sessionId);
  }

  return (
    <View className="flex-1 bg-cream">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: insets.top, paddingHorizontal: 20, backgroundColor: '#FAF7F2' }}>
        <View className="py-3">
          <Text style={{ fontFamily: 'InriaSans_400Regular', fontSize: 24, letterSpacing: 0.5, color: '#1B1B43' }}>{t('mentor.sessions.title')}</Text>
        </View>
        <PillTabs
          tabs={[
            { key: 'upcoming', label: t('mentee.bookings.tab_upcoming'), count: sessions.filter((s) => TAB_STATUS.upcoming.includes(s.status)).length },
            { key: 'past', label: t('mentee.bookings.tab_past'), count: sessions.filter((s) => s.status === 'completed').length },
            { key: 'cancelled', label: t('mentee.bookings.tab_cancelled'), count: sessions.filter((s) => TAB_STATUS.cancelled.includes(s.status)).length },
          ]}
          activeKey={tab}
          onSelect={(k) => setTab(k as Tab)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 8, paddingBottom: TAB_HEIGHT + 8, paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <MentorSessionRow session={item} onAction={() => handleAction(item.id, item.status)} />
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <View className="w-24 h-24 rounded-3xl bg-emerald-100 items-center justify-center">
              <Text style={{ fontSize: 40 }}>✅</Text>
            </View>
            <Text className="text-[20px] font-light text-ink mt-4">{t('mentor.sessions.empty_title')}</Text>
            <Text className="text-[13px] text-ink/55 mt-2">{t('mentor.sessions.empty_subtitle')}</Text>
            <View className="mt-4 flex-row items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-line">
              <Text className="font-mono text-[11.5px] text-ink/70">adviz.bg/mentors/{user?.id?.slice(0, 8)}</Text>
              <TouchableOpacity className="px-3 py-1.5 rounded-full bg-purple-deep">
                <Text className="text-[11px] font-semibold text-white">{t('mentor.sessions.copy_link')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </View>
  );
}
