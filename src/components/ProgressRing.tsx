import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

interface ProgressRingProps {
  /** 0 a 1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  accessibilityLabel: string; // obrigatório — seção 122.1
}

/**
 * Anel de progresso construído sobre react-native-svg (seção 124.1).
 * Para múltiplos segmentos (calorias + macros sobrepostos), renderize
 * várias instâncias deste componente com raios diferentes, uma por
 * nutriente, usando as cores de tokens.ts (protein/carbs/fat/water).
 */
export function ProgressRing({
  progress,
  size = 160,
  strokeWidth = 14,
  color,
  trackColor,
  accessibilityLabel,
}: ProgressRingProps) {
  const { tokens } = useTheme();
  const ringColor = color ?? tokens.ring;
  const baseColor = trackColor ?? tokens.card;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={baseColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // Gira pra começar no topo (12h) em vez de 3h (padrão do SVG)
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
}
