import React from 'react';
import { Image, StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import loginAsset from '../../assets/mascote/login.svg';
import maintenanceAsset from '../../assets/mascote/maintenance.svg';

// SVG (não PNG) por pedido explícito — a ilustração em PNG ficava borrada
// ao ser exibida maior que sua resolução nativa. Um .svg importado assim é
// tratado pelo Metro como asset binário comum (mesmo mecanismo do PNG), e
// SvgUri (já vem com react-native-svg, sem lib nova) busca esse asset pela
// URI resolvida e desenha o vetor — evita depender de um transformer de SVG
// no Metro só pra isso.
const MASCOTS = {
  login: { asset: loginAsset, aspectRatio: 227 / 267 },
  maintenance: { asset: maintenanceAsset, aspectRatio: 430 / 430 },
} as const;

type MascotVariant = keyof typeof MASCOTS;

interface MascotIllustrationProps {
  variant?: MascotVariant;
  width: number;
  style?: StyleProp<ViewStyle>;
}

export function MascotIllustration({ variant = 'login', width, style }: MascotIllustrationProps) {
  const { asset, aspectRatio } = MASCOTS[variant];
  const uri = Image.resolveAssetSource(asset).uri;

  return <SvgUri uri={uri} width={width} height={width / aspectRatio} style={style} />;
}
