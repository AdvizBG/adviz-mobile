import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, Video } from 'lucide-react-native';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { MCard } from '../../../src/components/ui/MCard';
import { Eyebrow } from '../../../src/components/ui/Eyebrow';
import { CTA } from '../../../src/components/ui/CTA';
import { MAvatar } from '../../../src/components/ui/MAvatar';
import { useSession } from '../../../src/features/Sessions/api/hooks';
import { useMentor } from '../../../src/features/Mentors/api/hooks';

export default function SessionConfirmationScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: session } = useSession(sessionId);
  const { data: mentor } = useMentor(session?.mentor_id ?? '');

  if (!session) return null;

  const start = new Date(session.scheduled_start);
  const minutesUntil = (start.getTime() - Date.now()) / 60_000;
  const joinEnabled = minutesUntil <= 5;

  function formatCountdown(mins: number): string {
    const clamped = Math.max(0, mins);
    const h = Math.floor(clamped / 60);
    const m = Math.floor(clamped % 60);
    return h > 0 ? `${h}${t('common.hours')} ${m}${t('common.min')}` : `${m}${t('common.min')}`;
  }

  return (
    <View className="flex-1 bg-cream">
      <AppHeader right={<TouchableOpacity onPress={() => router.replace('/(mentee)/bookings' as never)}><X size={22} color="#1B1B43" /></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ paddingTop: 110, paddingBottom: 96 + insets.bottom, paddingHorizontal: 20, alignItems: 'center' }}>
        <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center">
          <View style={{ position: 'absolute', top: 12, bottom: 12, left: 12, right: 12, borderRadius: 999, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={28} color="white" strokeWidth={2.8} />
          </View>
        </View>

        <Text className="mt-4 text-[24px] font-light tracking-tight text-ink text-center leading-snug max-w-[280px]">
          {t('mentee.booking.session_confirmed')}
        </Text>
        <Text className="text-[13px] text-ink/55 text-center max-w-[290px] mx-auto leading-relaxed mt-2">
          Получи напомняне преди сесията. Провери имейла си.
        </Text>

        <MCard className="mt-5 p-4 w-full">
          {mentor && (
            <View className="flex-row items-center gap-3 mb-3">
              <MAvatar initials={(mentor.full_name || 'M').split(' ').map((n) => n[0]).join('').slice(0, 2)} color="#CBCBFF" size={48} />
              <View>
                <Text className="text-[14px] font-semibold text-ink">{mentor.full_name || 'Mentor'}</Text>
                <Text className="text-[11.5px] text-ink/60">{mentor.headline}</Text>
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { icon: '📅', label: 'Дата', value: start.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' }) },
              { icon: '🕐', label: 'Час', value: start.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) },
              { icon: '💳', label: 'Платено', value: `€${session.price_eur}` },
            ].map((d) => (
              <View key={d.label} style={{ width: '30%', alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: '#E0E0FF' }}>
                <Text className="text-[10px] uppercase tracking-wider text-ink/45 font-semibold">{d.label}</Text>
                <Text className="text-[12.5px] font-semibold text-ink mt-0.5 text-center">{d.value}</Text>
              </View>
            ))}
          </View>
        </MCard>

        <MCard className="mt-3 p-3.5 w-full">
          <Eyebrow>Тема</Eyebrow>
          <Text className="text-[14px] font-semibold text-ink mt-1">{session.topic}</Text>
        </MCard>

        <TouchableOpacity className="mt-3 w-full py-3 rounded-2xl bg-white border border-line-strong flex-row items-center justify-center gap-2">
          <Text className="text-ink font-semibold text-[13.5px]">{t('mentee.bookings.add_calendar')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: insets.bottom + 20, borderTopWidth: 1, borderTopColor: '#ECE9E2', backgroundColor: 'white' }}>
        {joinEnabled && session.recording_url ? (
          <CTA label={t('mentee.bookings.join')} onPress={() => Linking.openURL(session.recording_url!)} />
        ) : joinEnabled ? (
          <CTA label={t('mentee.bookings.join')} disabled />
        ) : (
          <TouchableOpacity disabled className="w-full py-3.5 rounded-2xl bg-slate-100 items-center flex-row justify-center gap-2">
            <Video size={16} color="rgba(27,27,67,0.4)" />
            <Text className="text-[14px] text-ink/40 font-semibold">
              {t('mentee.bookings.link_unlocks', { time: formatCountdown(minutesUntil) })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
