import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Play, MessageSquare, MoreVertical } from 'lucide-react-native';
import { MCard } from '../../../src/components/ui/MCard';
import { Eyebrow } from '../../../src/components/ui/Eyebrow';
import { useAuthStore } from '../../../src/store/auth';
import { useMentorMe } from '../../../src/features/MentorDashboard/api/hooks';
import { useMentorSessions, useStartSession } from '../../../src/features/Sessions/api/hooks';

export default function MentorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: profile } = useMentorMe();
  const { data: sessions = [] } = useMentorSessions('scheduled');
  const startSession = useStartSession();

  const nextSession = sessions[0];
  const TAB_HEIGHT = 49 + (insets.bottom > 0 ? insets.bottom : 8);

  return (
    <ScrollView
      className="flex-1 bg-cream"
      contentContainerStyle={{ paddingTop: insets.top + 116, paddingBottom: TAB_HEIGHT + 8, paddingHorizontal: 20 }}
    >
      {/* Header */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 12, zIndex: 10 }}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[12px] text-ink/55">{t('mentor.dashboard.greeting')}</Text>
            <Text style={{ fontSize: 22, letterSpacing: 0.5, color: '#1B1B43', lineHeight: 24 }}>
              {user?.full_name.split(' ')[0]}
            </Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-purple-200 items-center justify-center">
            <Text className="font-semibold text-ink text-[13px]">
              {user?.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Next session hero */}
      {nextSession && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Eyebrow>{t('mentor.dashboard.next_session')}</Eyebrow>
          </View>
          <View style={{ borderRadius: 24, padding: 16, backgroundColor: '#3E1D87' }}>
            <Text className="text-[11px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {new Date(nextSession.scheduled_start).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text className="text-[13.5px] font-medium text-white leading-snug" numberOfLines={2}>{nextSession.topic}</Text>
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                onPress={() => startSession.mutate(nextSession.id)}
                className="px-3 py-2 rounded-xl bg-white flex-row items-center gap-1.5"
              >
                <Play size={12} color="#3E1D87" fill="#3E1D87" />
                <Text className="text-purple-deep font-bold text-[12.5px]">{t('mentor.dashboard.start_session')}</Text>
              </TouchableOpacity>
              <TouchableOpacity className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <MessageSquare size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <MoreVertical size={16} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Stat cards */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
          { label: t('mentor.dashboard.stat_sessions'), value: profile?.total_sessions.toString() ?? '—', tint: 'bg-purple-100' },
          { label: t('mentor.dashboard.stat_rating'), value: profile?.avg_rating?.toFixed(1) ?? '—', tint: 'bg-peach/40' },
        ].map((stat) => (
          <MCard key={stat.label} className="p-3 flex-1">
            <View className={`w-7 h-7 rounded-lg ${stat.tint} items-center justify-center mb-1`}>
              <Text>📊</Text>
            </View>
            <Text className="text-[10.5px] text-ink/55 font-semibold uppercase tracking-wider">{stat.label}</Text>
            <Text className="text-[18px] font-bold text-ink">{stat.value}</Text>
          </MCard>
        ))}
      </View>

      {/* Upcoming sessions */}
      <View className="flex-row items-center justify-between mb-2">
        <Eyebrow>{t('mentor.dashboard.upcoming')}</Eyebrow>
        <TouchableOpacity onPress={() => router.push('/(mentor)/sessions' as never)}>
          <Text className="text-[11.5px] font-semibold text-purple-deep">{t('mentor.dashboard.see_all')}</Text>
        </TouchableOpacity>
      </View>
      <View className="bg-white rounded-2xl border border-line overflow-hidden">
        {sessions.slice(0, 3).map((session, i) => (
          <View key={session.id} className={`flex-row items-center gap-3 p-3 ${i > 0 ? 'border-t border-line' : ''}`}>
            <View className="w-9 h-9 rounded-full bg-purple-200 items-center justify-center">
              <Text className="text-[12px] font-semibold text-ink">MP</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[12.5px] font-semibold text-ink" numberOfLines={1}>{session.topic}</Text>
            </View>
            <Text className="text-[11px] font-semibold text-ink">
              {new Date(session.scheduled_start).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {sessions.length === 0 && (
          <View className="p-4 items-center">
            <Text className="text-[12px] text-ink/45">Няма предстоящи сесии</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
