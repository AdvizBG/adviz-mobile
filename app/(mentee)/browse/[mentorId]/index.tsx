import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, Share2 } from 'lucide-react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { AppHeader } from '../../../../src/components/ui/AppHeader';
import { MAvatar } from '../../../../src/components/ui/MAvatar';
import { MCard } from '../../../../src/components/ui/MCard';
import { Eyebrow } from '../../../../src/components/ui/Eyebrow';
import { TopicChip } from '../../../../src/components/ui/TopicChip';
import { CTA } from '../../../../src/components/ui/CTA';
import { useMentor } from '../../../../src/features/Mentors/api/hooks';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function MentorProfileScreen() {
  const { mentorId } = useLocalSearchParams<{ mentorId: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: mentor, isLoading } = useMentor(mentorId);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  if (isLoading || !mentor) {
    return <View className="flex-1 bg-cream items-center justify-center"><Text className="text-ink/50">{t('common.loading')}</Text></View>;
  }

  const price = parseFloat(mentor.hourly_price_eur);
  const firstSessionPrice = Math.round(price * 0.1);
  const STICKY_CTA_HEIGHT = 96;

  return (
    <View className="flex-1 bg-cream">
      <AppHeader
        showBack
        right={
          <TouchableOpacity className="w-9 h-9 rounded-full bg-white/80 border border-line items-center justify-center">
            <Share2 size={16} color="#1B1B43" />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={{ paddingTop: 106, paddingBottom: STICKY_CTA_HEIGHT + 24, paddingHorizontal: 20 }}>
        {/* Hero */}
        <View className="flex-row items-center gap-4">
          <MAvatar initials={initials(mentor.full_name)} color="#CBCBFF" size={84} online ring />
          <View className="flex-1">
            <Text className="text-[20px] font-light tracking-tight text-ink">{mentor.full_name}</Text>
            <Text className="text-[12.5px] text-ink/65 mt-0.5">{mentor.headline}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Star size={12} color="#FFB02E" fill="#FFB02E" />
              <Text className="text-[11.5px] font-semibold text-ink">{mentor.avg_rating?.toFixed(1) ?? '—'}</Text>
              <Text className="text-[11.5px] text-ink/50">· {mentor.total_sessions} сесии</Text>
            </View>
          </View>
        </View>

        {/* Badges grid */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[
            { label: 'Сесии', value: mentor.total_sessions.toString() },
            { label: 'Рейтинг', value: mentor.avg_rating?.toFixed(1) ?? '—' },
            { label: 'Цена / час', value: `€${price.toFixed(0)}`, highlighted: true },
          ].map((badge) => (
            <View key={badge.label} style={{ flex: 1, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: 'center', backgroundColor: badge.highlighted ? '#3E1D87' : 'white', borderColor: badge.highlighted ? '#3E1D87' : '#ECE9E2' }}>
              <Text style={{ fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, color: badge.highlighted ? 'rgba(255,255,255,0.7)' : 'rgba(27,27,67,0.55)' }}>{badge.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', marginTop: 2, color: badge.highlighted ? 'white' : '#1B1B43' }}>{badge.value}</Text>
            </View>
          ))}
        </View>

        {/* About */}
        <View className="mt-4">
          <Eyebrow>За ментора</Eyebrow>
          <Text className="text-[13.5px] text-ink/75 leading-relaxed mt-1" numberOfLines={aboutExpanded ? undefined : 4}>{mentor.about}</Text>
          <TouchableOpacity onPress={() => setAboutExpanded(!aboutExpanded)}>
            <Text className="text-[12px] font-semibold text-purple-deep mt-1">{aboutExpanded ? 'Скрий' : t('mentee.mentor_profile.show_more')}</Text>
          </TouchableOpacity>
        </View>

        {/* Topics */}
        <View className="mt-4">
          <Eyebrow>{t('mentee.mentor_profile.works_on')}</Eyebrow>
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {mentor.topics.map((topic) => <TopicChip key={topic} label={topic} active />)}
          </View>
        </View>

        {/* Reviews stub */}
        <View className="mt-4">
          <View className="flex-row justify-between items-center">
            <Eyebrow>{t('mentee.mentor_profile.reviews')}</Eyebrow>
            <TouchableOpacity><Text className="text-[11.5px] font-semibold text-purple-deep">{t('mentee.mentor_profile.all_reviews')}</Text></TouchableOpacity>
          </View>
          <Text className="text-[12px] text-ink/45 mt-2">Отзивите ще бъдат заредени след добавяне на ендпойнт GET /mentors/:id/reviews</Text>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderTopColor: '#ECE9E2', backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View>
          <Text className="text-[10.5px] uppercase tracking-wider text-ink/55 font-semibold">60 мин. · Първа сесия</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[18px] font-bold text-ink">€{firstSessionPrice}</Text>
            <Text className="text-[12px] text-ink/40 line-through">€{price.toFixed(0)}</Text>
          </View>
        </View>
        <CTA
          label={isOffline ? t('mentee.mentor_profile.offline_disabled') : t('mentee.mentor_profile.book')}
          onPress={() => router.push(`/(mentee)/browse/${mentorId}/book` as never)}
          disabled={isOffline}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
