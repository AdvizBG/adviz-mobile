import { View, Text, TouchableOpacity } from 'react-native';
import { cn } from '../../lib/cn';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface PillTabsProps {
  tabs: Tab[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function PillTabs({ tabs, activeKey, onSelect }: PillTabsProps) {
  return (
    <View className="flex-row items-center gap-1 bg-purple-100/50 rounded-full p-1">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            className={cn('flex-1 items-center py-2 rounded-full', active ? 'bg-white shadow-sm' : '')}
          >
            <Text className={cn('text-[12.5px] font-semibold', active ? 'text-purple-deep' : 'text-ink/55')}>
              {tab.label}
              {tab.count !== undefined ? ` ${tab.count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
