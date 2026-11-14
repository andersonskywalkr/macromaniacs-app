import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { useMyAvatar } from '@/hooks/useMyAvatar';
import type { AvatarConfig } from '@/utils/avatarConfig';
import { buildAvatarSvg } from '@/utils/avatarSvg';
import { buildInitials } from '@/utils/ranking';

import { fontFamily } from '@/theme/fonts';

// O SVG é gerado num tamanho só (e escalado pelo SvgXml): um único resultado em
// cache serve para o avatar de qualquer tamanho na tela.
export const AVATAR_RENDER_SIZE = 128;

interface AvatarProps {
  displayName: string;
  size?: number;
  streakCount?: number; // se fornecido, mostra o indicador de foguinho
  // Avatar desenhado explícito (tela de personalização). Tem prioridade.
  config?: AvatarConfig | null;
  // É o usuário logado? Então usa o avatar personalizado guardado neste
  // aparelho (o backend não sabe o avatar de ninguém: os outros ficam com
  // iniciais).
  isSelf?: boolean;
}

// Avatar único do app: desenho personalizado (gerado no aparelho, sem rede) ou
// iniciais. Se a geração falhar, ficam as iniciais — nunca um buraco ou erro.
export function Avatar({ isSelf = false, ...props }: AvatarProps) {
  return isSelf ? <SelfAvatar {...props} /> : <AvatarView {...props} />;
}

function SelfAvatar({ config, ...rest }: Omit<AvatarProps, 'isSelf'>) {
  const { config: own } = useMyAvatar();
  return <AvatarView config={config ?? own} {...rest} />;
}

function AvatarView({
  displayName,
  size = 48,
  streakCount,
  config = null,
}: Omit<AvatarProps, 'isSelf'>) {
  const { tokens } = useTheme();
  const round = { width: size, height: size, borderRadius: size / 2 };

  const svg = React.useMemo(() => {
    if (!config) return null;
    try {
      return buildAvatarSvg(config, AVATAR_RENDER_SIZE);
    } catch {
      return null; // falha ao gerar: volta às iniciais
    }
  }, [config]);

  return (
    <View style={{ width: size, height: size }}>
      {svg ? (
        <View
          accessible
          accessibilityLabel={`Foto de perfil de ${displayName}`}
          style={[styles.clip, round, { backgroundColor: tokens.card }]}
        >
          <SvgXml xml={svg} width={size} height={size} />
        </View>
      ) : (
        <View
          accessible
          accessibilityLabel={`Foto de perfil de ${displayName}`}
          style={[styles.fallback, round, { backgroundColor: tokens.primary }]}
        >
          <Text style={[styles.initials, { color: tokens.onPrimary, fontSize: size * 0.36 }]}>
            {buildInitials(displayName)}
          </Text>
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
  clip: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fontFamily(700),
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
