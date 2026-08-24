import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touchTarget } from '@/theme/tokens';

// Sobrescreve `style` do PressableProps: aqui ele é sempre um objeto/array
// estático (nunca a variante função-de-estado), como em todo uso atual do Button.
interface ButtonProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  label: string;
  loading?: boolean;
  // 'dark' inverte texto/fundo (bg = tokens.text, texto = tokens.background) —
  // usado nos botões de ação principal do protótipo (ex.: "Adicionar refeição").
  variant?: 'primary' | 'secondary' | 'dark';
  icon?: React.ReactNode;
  // accessibilityHint é opcional, mas exigido pelo lint quando a ação não é óbvia (122.1)
  accessibilityHint?: string;
}

export function Button({
  label,
  loading,
  variant = 'primary',
  icon,
  disabled,
  style,
  accessibilityHint,
  ...rest
}: ButtonProps) {
  const { tokens } = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary' ? tokens.primary : variant === 'dark' ? tokens.text : 'transparent';
  const contentColor = variant === 'primary' ? '#FFFFFF' : variant === 'dark' ? tokens.background : tokens.primary;

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      style={[
        styles.base,
        {
          backgroundColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: tokens.primary,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.card / 2,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    fontWeight: '700',
  },
});
