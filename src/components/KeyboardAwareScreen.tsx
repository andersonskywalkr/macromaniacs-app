import React, { createContext, forwardRef, useContext, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView as ControllerScrollView,
  type KeyboardAwareScrollViewProps,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

// Solução ÚNICA de teclado do app, sobre o react-native-keyboard-controller
// (que lê o teclado direto do sistema e acerta a altura real, com tela inteira
// no Android e no iOS). Use assim:
//
//   <KeyboardAwareScreen>            // container: sobe exatamente a altura do teclado
//     <Cabeçalho />
//     <KeyboardAwareScrollView>      // rola o campo em foco para ficar visível
//       <TextField ... />
//     </KeyboardAwareScrollView>
//     <KeyboardAwareFooter>          // rodapé (botão Salvar etc.): fica colado no teclado
//       <Button ... />
//     </KeyboardAwareFooter>
//   </KeyboardAwareScreen>
//
// Em telas sem rolagem (ex.: o chat), use só o container: o campo fixo no fim
// acompanha o teclado. Precisa do <KeyboardProvider> na raiz do app (App.tsx).
//
// POR QUE O RODAPÉ É UM COMPONENTE À PARTE: a rolagem da biblioteca põe o campo
// em foco logo acima do TECLADO. Se há um rodapé entre a lista e o teclado, o
// campo ficava escondido atrás do rodapé (era o caso do último campo do Editar
// perfil). O rodapé avisa a própria altura e a rolagem soma essa altura à
// folga.

// Folga (px) entre o campo em foco e o que está logo abaixo dele (o teclado,
// ou o rodapé quando há um).
export const FIELD_MARGIN = 24;

interface FooterContextValue {
  height: number;
  setHeight: (height: number) => void;
}

const FooterContext = createContext<FooterContextValue | null>(null);

interface KeyboardAwareScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function KeyboardAwareScreen({ children, style }: KeyboardAwareScreenProps) {
  const [footerHeight, setFooterHeight] = useState(0);
  const footer = useMemo<FooterContextValue>(
    () => ({ height: footerHeight, setHeight: setFooterHeight }),
    [footerHeight],
  );

  return (
    <FooterContext.Provider value={footer}>
      {/* automaticOffset: o container descobre sozinho onde fica na janela
          (barra de abas, cabeçalho, área segura) e só reserva o que o teclado
          cobre dele. */}
      <KeyboardAvoidingView behavior="padding" automaticOffset style={[styles.flex, style]}>
        {children}
      </KeyboardAvoidingView>
    </FooterContext.Provider>
  );
}

interface KeyboardAwareFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Rodapé fixo da tela (acima do teclado). Informa a altura à rolagem.
export function KeyboardAwareFooter({ children, style }: KeyboardAwareFooterProps) {
  const context = useContext(FooterContext);
  const setHeight = context?.setHeight;

  useEffect(() => () => setHeight?.(0), [setHeight]);

  return (
    <View style={style} onLayout={(event: LayoutChangeEvent) => setHeight?.(event.nativeEvent.layout.height)}>
      {children}
    </View>
  );
}

// ScrollView que os toques e o teclado respeitam: toques em botões funcionam
// com o teclado aberto, o teclado fecha ao rolar e o campo em foco é rolado
// para ficar visível acima do teclado E do rodapé (também quando o texto
// cresce em várias linhas).
export const KeyboardAwareScrollView = forwardRef<KeyboardAwareScrollViewRef, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(props, ref) {
    const footerHeight = useContext(FooterContext)?.height ?? 0;

    return (
      <ControllerScrollView
        ref={ref}
        bottomOffset={FIELD_MARGIN + footerHeight}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        {...props}
      />
    );
  },
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
