import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';

interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function AppHeader({ title, onBack, showBack = false, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: insets.top + 2,
        height: 52,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 30,
        overflow: 'visible',
      }}
    >
      <View style={{ width: 40 }}>
        {showBack && (
          <TouchableOpacity onPress={onBack ?? (() => router.back())}>
            <ChevronLeft size={22} color="#1B1B43" />
          </TouchableOpacity>
        )}
      </View>
      {title && (
        <Text className="font-semibold text-[15px] text-ink">{title}</Text>
      )}
      <View style={{ width: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
