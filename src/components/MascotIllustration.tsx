import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LOGIN_MASCOT_XML, MAINTENANCE_MASCOT_XML } from './mascotSvgs';

const MASCOTS = {
  login: { xml: LOGIN_MASCOT_XML, aspectRatio: 227 / 267 },
  maintenance: { xml: MAINTENANCE_MASCOT_XML, aspectRatio: 1 },
} as const;

type MascotVariant = keyof typeof MASCOTS;

interface MascotIllustrationProps {
  variant?: MascotVariant;
  width: number;
  style?: StyleProp<ViewStyle>;
}

export function MascotIllustration({ variant = 'login', width, style }: MascotIllustrationProps) {
  const { xml, aspectRatio } = MASCOTS[variant];

  return <SvgXml xml={xml} width={width} height={width / aspectRatio} style={style} />;
}
