import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { ChoicePill } from '@/components/ChoicePill';
import { CheckIcon } from '@/components/icons';
import { InlineRetry } from '@/components/InlineRetry';
import { useMyAvatar } from '@/hooks/useMyAvatar';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/api/ApiError';
import {
  AVATAR_OPTIONS_COUNT,
  AVATAR_STYLES,
  buildAvatarUrl,
  generateAvatarSeeds,
  type AvatarStyleId,
} from '@/utils/avatar';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AvatarPicker'>;

const COLUMNS = 3;
// PNG pequeno na grade (a DiceBear aceita até 256).
const GRID_IMAGE_SIZE = 128;
// A DiceBear limita o PNG a 10 pedidos por segundo: as 12 imagens são pedidas
// uma a cada 130 ms (cerca de 7 por segundo).
const STAGGER_MS = 130;
const TILE_BORDER = 3;

function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.isNetworkError) {
    return 'Sem conexão com o servidor. Confira a internet e tente novamente.';
  }
  if (error instanceof ApiError && error.message) return error.message;
  return 'Não foi possível salvar o avatar. Tente novamente.';
}

// Escolha do avatar de desenho. No modo real, o backend confirma a escolha
// antes de a tela voltar; no modo mock, o cache local mantém o comportamento.
export function AvatarPickerScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const { choice, save } = useMyAvatar();
  const displayName = user?.displayName ?? user?.username ?? '';

  const [style, setStyle] = useState<AvatarStyleId>(AVATAR_STYLES[0].id);
  const [seeds, setSeeds] = useState<string[]>(() => generateAvatarSeeds());
  const [selected, setSelected] = useState<string | null>(null);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const touched = useRef(false);
  const savingRef = useRef(false);

  // Mostra o avatar atual como primeira opção, já selecionado (se a pessoa
  // ainda não mexeu em nada quando ele terminar de carregar).
  useEffect(() => {
    if (!choice || touched.current) return;
    touched.current = true;
    setStyle(choice.style);
    setSeeds((previous) => [choice.seed, ...previous.filter((seed) => seed !== choice.seed)].slice(0, AVATAR_OPTIONS_COUNT));
    setSelected(choice.seed);
  }, [choice]);

  const tile = Math.floor((width - spacing.lg * 2 - spacing.md * (COLUMNS - 1)) / COLUMNS);

  function pickStyle(next: AvatarStyleId) {
    touched.current = true;
    setStyle(next);
    setFailed(new Set());
  }

  function drawNew() {
    touched.current = true;
    setSeeds(generateAvatarSeeds());
    setSelected(null);
    setFailed(new Set());
    setReloadKey((key) => key + 1);
  }

  function retryImages() {
    setFailed(new Set());
    setReloadKey((key) => key + 1);
  }

  function markFailed(seed: string) {
    setFailed((previous) => (previous.has(seed) ? previous : new Set(previous).add(seed)));
  }

  async function handleSave() {
    if (!selected || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await save({ style, seed: selected });
      navigation.goBack();
    } catch (error) {
      setSaveError(saveErrorMessage(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: tokens.text }]}>Escolher avatar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.note, { color: tokens.textSecondary }]}>
          Sua escolha fica vinculada à conta e será restaurada em outros dispositivos.
        </Text>

        <View accessibilityRole="radiogroup" style={styles.styles}>
          {AVATAR_STYLES.map((option) => (
            <ChoicePill
              key={option.id}
              label={option.label}
              selected={style === option.id}
              onPress={() => pickStyle(option.id)}
            />
          ))}
        </View>

        <View accessibilityRole="radiogroup" style={styles.grid}>
          {seeds.map((seed, index) => {
            const isSelected = selected === seed;
            return (
              <Pressable
                key={`${seed}-${reloadKey}`}
                accessibilityRole="radio"
                accessibilityLabel={`Avatar ${index + 1} de ${seeds.length}${isSelected ? ', selecionado' : ''}`}
                accessibilityState={{ selected: isSelected }}
                hitSlop={4}
                onPress={() => {
                  touched.current = true;
                  setSelected(seed);
                }}
                style={[
                  styles.tile,
                  {
                    backgroundColor: tokens.card,
                    borderColor: isSelected ? tokens.primary : tokens.card,
                    height: tile,
                    width: tile,
                  },
                ]}
              >
                <Avatar
                  uri={buildAvatarUrl({ style, seed, size: GRID_IMAGE_SIZE })}
                  displayName={displayName}
                  size={tile - TILE_BORDER * 2 - spacing.sm}
                  loadDelayMs={index * STAGGER_MS}
                  onImageError={() => markFailed(seed)}
                />
                {isSelected && (
                  <View style={[styles.check, { backgroundColor: tokens.primary }]}>
                    <CheckIcon size={14} color={tokens.onPrimary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {failed.size > 0 && (
          <InlineRetry
            message="Não foi possível carregar alguns avatares. Confira a internet."
            onRetry={retryImages}
          />
        )}

        <Button
          label="Sortear novos"
          variant="secondary"
          onPress={drawNew}
          accessibilityHint="Mostra 12 avatares novos"
        />

        <Text style={[styles.credits, { color: tokens.textSecondary }]}>
          Ilustrações pela DiceBear (dicebear.com). Avataaars: Pablo Stanley. Adventurer: Lisa Wischofsky,
          Big Smile: Ashley Seo e Fun Emoji: Davis Uche, sob licença CC BY 4.0.
        </Text>

        {saveError && (
          <Text accessibilityRole="alert" style={[styles.saveError, { color: tokens.danger }]}>
            {saveError}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={styles.footerButton} />
        <Button
          label="Salvar"
          onPress={handleSave}
          disabled={!selected || saving}
          loading={saving}
          accessibilityHint="Usa o avatar escolhido no seu perfil"
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: -4,
    width: 24,
  },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.sm },
  credits: { fontFamily: fontFamily(600), fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm },
  footerButton: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  note: { fontFamily: fontFamily(600), fontSize: 13 },
  saveError: { fontFamily: fontFamily(600), fontSize: 13 },
  styles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: TILE_BORDER,
    justifyContent: 'center',
  },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
});
