import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { cn } from '../../lib/cn';

interface CTAProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'dark';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  testID?: string;
  style?: ViewStyle;
}

export function CTA({ label, onPress, variant = 'primary', disabled, loading, className, testID, style }: CTAProps) {
  const base = 'w-full py-3.5 rounded-2xl items-center justify-center';
  const variants = {
    primary: disabled ? 'bg-slate-200' : 'bg-purple-deep',
    dark: disabled ? 'bg-slate-200' : 'bg-ink',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
      className={cn(base, variants[variant], className)}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className={cn('font-bold text-[15px]', disabled ? 'text-ink/40' : 'text-white')}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
