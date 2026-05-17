import { View, ViewProps } from 'react-native';
import { cn } from '../../lib/cn';

interface MCardProps extends ViewProps {
  className?: string;
}

export function MCard({ children, className, style, ...props }: MCardProps) {
  return (
    <View
      className={cn('rounded-2xl bg-white border border-line', className)}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
