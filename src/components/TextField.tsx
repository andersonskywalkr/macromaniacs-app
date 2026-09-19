import React, { useState } from 'react';
import { View, TextInput, TextInputProps, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget } from '@/theme/tokens';
import { EyeIcon, EyeOffIcon } from './icons';

interface TextFieldProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  style?: StyleProp<ViewStyle>;
  // Quando true, mostra o campo como senha com botão de alternar
  // visibilidade — mesmo comportamento do protótipo (login/cadastro).
  secureTextEntry?: boolean;
  accessibilityLabel: string;
}

// Input em formato de pílula, usado em Login/Cadastro/Onboarding —
// mesmo visual em todo o app em vez de repetir o StyleSheet em cada tela.
export function TextField({ style, secureTextEntry, accessibilityLabel, ...rest }: TextFieldProps) {
  const { tokens } = useTheme();
  const [visible, setVisible] = useState(false);
  const isPasswordField = !!secureTextEntry;
  const hidden = isPasswordField && !visible;
  const paddingRight = isPasswordField ? 48 : spacing.md + spacing.xs;

  return (
    <View style={style}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={tokens.textSecondary}
        secureTextEntry={hidden}
        style={[styles.input, { backgroundColor: tokens.card, color: tokens.text, paddingRight }]}
        {...rest}
      />
      {isPasswordField && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
          hitSlop={8}
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}
        >
          {hidden ? (
            <EyeOffIcon size={20} color={tokens.textSecondary} />
          ) : (
            <EyeIcon size={20} color={tokens.textSecondary} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 999,
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    fontWeight: '600',
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.md + spacing.xs,
    paddingVertical: spacing.sm + spacing.xs,
    width: '100%',
  },
  toggle: {
    alignItems: 'center',
    height: touchTarget.minSize,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: 0,
    width: 24,
  },
});
