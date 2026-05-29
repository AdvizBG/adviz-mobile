import { View, Text, TouchableOpacity } from 'react-native';
import { MCard } from '../../../components/ui/MCard';
import { SessionBadge } from '../../../components/ui/SessionBadge';
import { MAvatar } from '../../../components/ui/MAvatar';
import { useMentorByUserId } from '../../Mentors/api/hooks';
import type { SessionRead } from '../../../lib/types';

interface BookingRowProps {
  session: SessionRead;
  onPrimary: () => void;
  onCancel?: () => void;
}

export function BookingRow({ session, onPrimary, onCancel }: BookingRowProps) {
  const { data: mentor } = useMentorByUserId(session.mentor_id);
  const mentorName = mentor?.full_name ?? '…';
  const start = new Date(session.scheduled_start);
  const timeLabel = start.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
  const duration = Math.round((new Date(session.scheduled_end).getTime() - start.getTime()) / 60_000);

  const primaryLabel = session.status === 'live' ? 'Влез' : session.status === 'scheduled' ? 'Виж' : 'Детайли';
  const primaryStyle = session.status === 'live' ? 'bg-coral' : 'bg-purple-deep';

  return (
    <MCard className="p-3.5 mt-2 flex-row gap-3">
      <MAvatar initials={mentor?.avatar_initials ?? mentorName.slice(0, 2)} color={mentor?.avatar_color ?? '#CBCBFF'} size={44} />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <SessionBadge status={session.status} />
          <Text className="text-[10.5px] text-ink/55">{timeLabel}</Text>
        </View>
        <Text className="text-[13.5px] font-semibold text-ink mt-1" numberOfLines={1}>{session.topic}</Text>
        <Text className="text-[11.5px] text-ink/55 mt-0.5">с {mentorName} · {duration} мин</Text>
        <View className="flex-row gap-2 mt-2">
          <TouchableOpacity onPress={onPrimary} className={`px-3 py-1.5 rounded-full ${primaryStyle}`}>
            <Text className="text-[11.5px] font-semibold text-white">{primaryLabel}</Text>
          </TouchableOpacity>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} className="px-3 py-1.5 rounded-full bg-white border border-line-strong">
              <Text className="text-[11.5px] font-semibold text-ink/70">Отмени</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </MCard>
  );
}
