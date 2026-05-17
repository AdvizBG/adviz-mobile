import { View } from 'react-native';

interface StepDotsProps {
  total: number;
  current: number; // 0-indexed
}

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <View
            key={i}
            style={{
              width: isActive ? 22 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isActive ? '#3E1D87' : isDone ? '#9192FF' : '#DAD6CC',
            }}
          />
        );
      })}
    </View>
  );
}
