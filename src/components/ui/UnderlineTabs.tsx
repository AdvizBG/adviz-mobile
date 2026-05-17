import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { cn } from '../../lib/cn';

interface UnderlineTab {
  key: string;
  label: string;
}

interface UnderlineTabsProps {
  tabs: UnderlineTab[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function UnderlineTabs({ tabs, activeKey, onSelect }: UnderlineTabsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row items-center gap-5 border-b border-line">
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              className={cn(
                'pb-2.5',
                active ? '-mb-px border-b-2 border-purple-deep' : '',
              )}
            >
              <Text className={cn('text-[13px]', active ? 'font-semibold text-purple-deep' : 'text-ink/45')}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
