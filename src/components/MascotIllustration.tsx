import React from 'react';
import { Image, StyleProp, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import mascotAsset from '../../assets/mascote/login.svg';

// Proporção real do arquivo assets/mascote/login.svg (227×267).
const MASCOT_ASPECT_RATIO = 227 / 267;

// SVG (não PNG) por pedido explícito — a ilustração em PNG ficava borrada
// ao ser exibida maior que sua resolução nativa. Um .svg importado assim é
// tratado pelo Metro como asset binário comum (mesmo mecanismo do PNG), e
// SvgUri (já vem com react-native-svg, sem lib nova) busca esse asset pela
// URI resolvida e desenha o vetor — evita depender de um transformer de SVG
// no Metro só pra isso.
const mascotSource = Image.resolveAssetSource(mascotAsset);

interface MascotIllustrationProps {
  width: number;
  style?: StyleProp<ViewStyle>;
}

export function MascotIllustration({ width, style }: MascotIllustrationProps) {
  return (
    <SvgUri
      uri={mascotSource.uri}
      width={width}
      height={width / MASCOT_ASPECT_RATIO}
      style={style}
    />
  );
}
