import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { MCard } from '../../../components/ui/MCard';
import { MAvatar } from '../../../components/ui/MAvatar';
import type { MentorProfileRead } from '../../../lib/types';

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

interface MentorCardProps {
  mentor: MentorProfileRead;
  isOnlineToday?: boolean;
  testID?: string;
}

export const MentorCard = React.memo(function MentorCard({ mentor, isOnlineToday, testID }: MentorCardProps) {
  const name = mentor.full_name || mentor.headline || 'Mentor';
  const price = parseFloat(mentor.hourly_price_eur).toFixed(0);
  const avatarUri = `https://i.pravatar.cc/100?u=${mentor.id}`;
  return (
    <TouchableOpacity testID={testID} onPress={() => router.push(`/(mentee)/browse/${mentor.id}` as never)}>
      <MCard className="p-3.5 flex-row items-start gap-3 mt-2">
        <MAvatar initials={initials(name)} color="#CBCBFF" size={56} uri={avatarUri} online={isOnlineToday} />
        <View className="flex-1">
          <View className="flex-row justify-between">
            <View className="flex-1 mr-2">
              <Text className="font-semibold text-ink text-[14px] leading-tight" numberOfLines={1}>{name}</Text>
              <Text className="text-[11.5px] text-ink/60 mt-0.5" numberOfLines={1}>{mentor.headline}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[14px] font-bold text-ink">€{price}</Text>
              <Text className="text-[10px] text-ink/50">/час</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1 mt-1.5">
            <Star size={11} color="#FFB02E" fill="#FFB02E" />
            <Text className="text-[11px] font-semibold text-ink">{mentor.avg_rating?.toFixed(1) ?? '—'}</Text>
            <Text className="text-[11px] text-ink/50">· {mentor.total_sessions} сесии</Text>
            {isOnlineToday && <Text className="text-[11px] text-emerald-700 font-medium">· Днес</Text>}
          </View>
          <View className="flex-row gap-1 mt-2 flex-wrap">
            {mentor.topics.slice(0, 3).map((t) => (
              <View key={t} className="px-2 py-0.5 rounded-full bg-purple-100">
                <Text className="text-[10.5px] font-medium text-purple-deep">{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </MCard>
    </TouchableOpacity>
  );
});
