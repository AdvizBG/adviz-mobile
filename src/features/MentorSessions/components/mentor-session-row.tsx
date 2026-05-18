import { View, Text, TouchableOpacity } from 'react-native';
import { MCard } from '../../../components/ui/MCard';
import { SessionBadge } from '../../../components/ui/SessionBadge';
import { MAvatar } from '../../../components/ui/MAvatar';
import type { SessionRead } from '../../../lib/types';

interface MentorSessionRowProps {
  session: SessionRead;
  onAction: () => void;
}

export function MentorSessionRow({ session, onAction }: MentorSessionRowProps) {
  const start = new Date(session.scheduled_start);

  const actionLabel = session.status === 'live' ? 'Приключи' : session.status === 'scheduled' ? 'Започни' : 'Детайли';
  const actionStyle = session.status === 'live' ? 'bg-coral' : session.status === 'scheduled' ? 'bg-purple-deep' : 'bg-white border border-line-strong';
  const actionTextStyle =
    session.status === 'live' || session.status === 'scheduled'
      ? 'text-white'
      : 'text-ink';

  return (
    <MCard className="p-3 mt-2 flex-row items-start gap-3">
      <MAvatar initials="МП" color="#CBCBFF" size={42} />
      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-2">
            <Text className="text-[12.5px] font-semibold text-ink" numberOfLines={1}>{session.topic}</Text>
          </View>
          <Text className="text-[12px] font-bold text-ink">
            {start.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-1.5">
          <SessionBadge status={session.status} />
          <TouchableOpacity onPress={onAction} className={`px-3 py-1 rounded-full ${actionStyle}`}>
            <Text className={`text-[11px] font-semibold ${actionTextStyle}`}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </MCard>
  );
}
