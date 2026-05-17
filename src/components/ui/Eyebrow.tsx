import { Text, TextProps } from 'react-native';
import { cn } from '../../lib/cn';

interface EyebrowProps extends TextProps {
  className?: string;
}

export function Eyebrow({ children, className, ...props }: EyebrowProps) {
  return (
    <Text
      className={cn('text-[10.5px] uppercase tracking-[0.12em] font-semibold text-ink/50', className)}
      {...props}
    >
      {children}
    </Text>
  );
}
