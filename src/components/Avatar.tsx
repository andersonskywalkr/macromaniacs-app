import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useMyAvatar } from '@/hooks/useMyAvatar';
import { avatarRequestSize, buildAvatarUrl } from '@/utils/avatar';
import { buildInitials } from '@/utils/ranking';

import { fontFamily } from '@/theme/fonts';
interface AvatarProps {
  // Foto/imagem explícita (ex.: opção da tela de escolha). Tem prioridade.
  uri?: string | null;
  displayName: string;
  size?: number;
  streakCount?: number; // se fornecido, mostra o indicador de foguinho
  // É o usuário logado? Então usa a configuração persistida no perfil.
  // Outros membros continuam com iniciais enquanto os DTOs sociais não expõem
  // uma configuração visual pública.
  isSelf?: boolean;
  // Espera antes de pedir a imagem (a grade escalona os pedidos por causa do
  // limite de 10 PNG por segundo da DiceBear).
  loadDelayMs?: number;
  // A imagem falhou (offline, 429, erro): o avatar já mostra as iniciais.
  onImageError?: () => void;
}

// Avatar único do app: imagem (quando há) ou iniciais. Enquanto a imagem
// carrega, e se ela falhar, ficam as iniciais — nunca um buraco ou erro.
export function Avatar({ isSelf = false, ...props }: AvatarProps) {
  return isSelf ? <SelfAvatar {...props} /> : <AvatarView {...props} />;
}

function SelfAvatar({ uri, size = 48, ...rest }: Omit<AvatarProps, 'isSelf'>) {
  const { choice } = useMyAvatar();
  const ownUri = choice
    ? buildAvatarUrl({ style: choice.style, seed: choice.seed, size: avatarRequestSize(size) })
    : null;
  return <AvatarView uri={uri ?? ownUri} size={size} {...rest} />;
}

function AvatarView({
  uri = null,
  displayName,
  size = 48,
  streakCount,
  loadDelayMs = 0,
  onImageError,
}: Omit<AvatarProps, 'isSelf'>) {
  const { tokens } = useTheme();
  const initials = buildInitials(displayName);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(loadDelayMs <= 0);

  // Imagem nova (outra URL): recomeça o carregamento.
  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [uri]);

  useEffect(() => {
    if (loadDelayMs <= 0) {
      setReady(true);
      return undefined;
    }
    setReady(false);
    const timer = setTimeout(() => setReady(true), loadDelayMs);
    return () => clearTimeout(timer);
  }, [loadDelayMs, uri]);

  const showImage = Boolean(uri) && ready && !failed;
  const showInitials = !uri || failed || !loaded;
  const round = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={{ width: size, height: size }}>
      {showInitials && (
        <View
          accessible
          accessibilityLabel={`Foto de perfil de ${displayName}`}
          style={[styles.fallback, round, { backgroundColor: tokens.primary }]}
        >
          <Text style={[styles.initials, { color: tokens.onPrimary, fontSize: size * 0.36 }]}>{initials}</Text>
        </View>
      )}
      {showImage && uri && (
        <Image
          source={{ uri }}
          accessibilityLabel={`Foto de perfil de ${displayName}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            onImageError?.();
          }}
          style={[styles.image, round, !loaded && styles.imageHidden]}
        />
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
    left: 0,
    position: 'absolute',
    resizeMode: 'cover',
    top: 0,
  },
  imageHidden: {
    opacity: 0,
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
