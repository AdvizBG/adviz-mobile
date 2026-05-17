import { TouchableOpacity, Text } from 'react-native';
import { cn } from '../../lib/cn';

interface TopicChipProps {
  label: string;
  active?: boolean;
  size?: 'sm' | 'default';
  onPress?: () => void;
}

export function TopicChip({ label, active, size = 'default', onPress }: TopicChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className={cn(
        'rounded-full border font-medium',
        size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5',
        active ? 'bg-purple-deep border-purple-deep' : 'bg-white border-line-strong',
      )}
    >
      <Text
        className={cn(
          size === 'sm' ? 'text-[11.5px]' : 'text-[12.5px]',
          active ? 'text-white' : 'text-ink/75',
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
