import { useState } from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';

interface MAvatarProps {
  initials: string;
  color: string;
  size: number;
  uri?: string;
  online?: boolean;
  ring?: boolean;
  style?: ViewStyle;
}

export function MAvatar({ initials, color, size, uri, online, ring, style }: MAvatarProps) {
  const fontSize = Math.round(size * 0.36);
  const dotSize = Math.round(size * 0.22);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!uri && !imgFailed;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...(ring
            ? {
                shadowColor: '#FAF7F2',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 3,
                elevation: 3,
              }
            : {}),
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <Text style={{ fontSize, fontWeight: '600', color: '#1B1B43' }}>{initials}</Text>
      )}
      {online && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: '#2A9D8F',
            borderWidth: 2,
            borderColor: 'white',
          }}
        />
      )}
    </View>
  );
}
