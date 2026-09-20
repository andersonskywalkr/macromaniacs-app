import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface AvatarProps {
  uri: string | null;
  displayName: string;
  size?: number;
  streakCount?: number; // se fornecido, mostra o indicador de foguinho
}

export function Avatar({ uri, displayName, size = 48, streakCount }: AvatarProps) {
  const { tokens } = useTheme();
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel={`Foto de perfil de ${displayName}`}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          accessible
          accessibilityLabel={`Foto de perfil de ${displayName}`}
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: tokens.primary },
          ]}
        >
          <Text style={[styles.initials, { color: tokens.onPrimary }]}>{initials}</Text>
        </View>
      )}
      {streakCount != null && streakCount > 0 && (
        <View style={styles.streakBadge} accessibilityLabel={`Sequência de ${streakCount} dias`}>
          <Text style={styles.streakText}>🔥</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontFamily: 'PlusJakartaSans',
    fontWeight: '700',
  },
  streakBadge: {
    bottom: -2,
    position: 'absolute',
    right: -2,
  },
  streakText: {
    fontSize: 16,
  },
});
