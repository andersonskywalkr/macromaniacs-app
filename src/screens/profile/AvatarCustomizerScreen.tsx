import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { ChoicePill } from '@/components/ChoicePill';
import { CheckIcon } from '@/components/icons';
import { useMyAvatar } from '@/hooks/useMyAvatar';
import { useAuthStore } from '@/store/authStore';
import {
  TRANSPARENT,
  defaultAvatarConfig,
  randomAvatarConfig,
  sameAvatarConfig,
  type AvatarConfig,
  type AvatarOptions,
} from '@/utils/avatarConfig';
import { buildAvatarSvg } from '@/utils/avatarSvg';
import {
  CATEGORIES,
  OPTIONS_PER_ROW,
  buildPanelRows,
  type CategoryId,
  type ColorField,
  type OptionField,
  type PanelRow,
} from './avatarCategories';

type Props = NativeStackScreenProps<ProfileStackParamList, 'AvatarCustomizer'>;

const PREVIEW_SIZE = 132;
const THUMB_SIZE = 96; // tamanho gerado das miniaturas (mostradas menores)
const SAVED_FEEDBACK_MS = 700;
const TILE_BORDER = 3;
const BUBBLE_SIZE = touchTarget.minSize;

type Select = (field: OptionField | ColorField, value: string | null) => void;

function safeSvg(config: AvatarConfig, size: number): string | null {
  try {
    return buildAvatarSvg(config, size);
  } catch {
    return null;
  }
}

// Preto ou branco, o que contrastar mais com a cor da bolinha (ícone de check).
function checkColorFor(hex: string): string {
  if (hex === TRANSPARENT) return '#000000';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000000' : '#FFFFFF';
}

interface OptionTileProps {
  field: OptionField;
  value: string | null;
  xml: string | null;
  selected: boolean;
  label: string;
  size: number;
  onSelect: Select;
}

// Miniatura de uma opção: o avatar atual com aquela opção aplicada.
const OptionTile = memo(function OptionTile({ field, value, xml, selected, label, size, onSelect }: OptionTileProps) {
  const { tokens } = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => onSelect(field, value)}
      style={[
        styles.tile,
        {
          backgroundColor: tokens.card,
          borderColor: selected ? tokens.primary : tokens.card,
          height: size,
          width: size,
        },
      ]}
    >
      {xml ? (
        <SvgXml xml={xml} width={size - TILE_BORDER * 2 - spacing.xs} height={size - TILE_BORDER * 2 - spacing.xs} />
      ) : (
        <Text style={[styles.tileFallback, { color: tokens.textSecondary }]}>?</Text>
      )}
      {selected && (
        <View style={[styles.check, { backgroundColor: tokens.primary }]}>
          <CheckIcon size={14} color={tokens.onPrimary} />
        </View>
      )}
    </Pressable>
  );
});

interface ColorBubbleProps {
  field: ColorField;
  color: string;
  selected: boolean;
  label: string;
  onSelect: Select;
}

const ColorBubble = memo(function ColorBubble({ field, color, selected, label, onSelect }: ColorBubbleProps) {
  const { tokens } = useTheme();
  const transparent = color === TRANSPARENT;
  const fill = { backgroundColor: transparent ? tokens.card : `#${color}` };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={transparent ? `${label}, transparente` : label}
      accessibilityState={{ selected }}
      onPress={() => onSelect(field, color)}
      style={styles.bubbleHit}
    >
      <View
        style={[
          styles.bubble,
          fill,
          { borderColor: selected ? tokens.primary : tokens.textSecondary },
          selected && styles.bubbleSelected,
          transparent && styles.bubbleTransparent,
        ]}
      >
        {transparent && !selected && <Text style={[styles.bubbleGlyph, { color: tokens.textSecondary }]}>∅</Text>}
        {selected && <CheckIcon size={16} color={checkColorFor(transparent ? 'ffffff' : color)} />}
      </View>
    </Pressable>
  );
});

interface RowProps {
  row: PanelRow;
  draft: AvatarConfig;
  tile: number;
  onSelect: Select;
}

function PanelRowView({ row, draft, tile, onSelect }: RowProps) {
  const { tokens } = useTheme();

  if (row.type === 'title') {
    return <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>{row.text}</Text>;
  }
  if (row.type === 'note') {
    return <Text style={[styles.note, { color: tokens.textSecondary }]}>{row.text}</Text>;
  }
  if (row.type === 'colors') {
    return (
      <View accessibilityRole="radiogroup" style={styles.colorsRow}>
        {row.colors.map((color, index) => (
          <ColorBubble
            key={color}
            field={row.field}
            color={color}
            selected={draft.options[row.field] === color}
            label={`${row.label}, cor ${index + 1} de ${row.colors.length}${
              draft.options[row.field] === color ? ', selecionada' : ''
            }`}
            onSelect={onSelect}
          />
        ))}
      </View>
    );
  }

  return (
    <View accessibilityRole="radiogroup" style={[styles.optionsRow, { gap: spacing.sm }]}>
      {row.items.map((item) => {
        const selected = draft.options[row.field] === item.value;
        const thumb: AvatarConfig = {
          ...draft,
          options: { ...draft.options, [row.field]: item.value } as AvatarOptions,
        };
        return (
          <OptionTile
            key={item.value ?? 'none'}
            field={row.field}
            value={item.value}
            xml={safeSvg(thumb, THUMB_SIZE)}
            selected={selected}
            label={`${row.label}${item.value === null ? ', nenhum' : ''}, opção ${item.position} de ${row.total}${
              selected ? ', selecionada' : ''
            }`}
            size={tile}
            onSelect={onSelect}
          />
        );
      })}
    </View>
  );
}

// Personalizar avatar (estilo Avataaars, gerado no aparelho, sem rede). Fica só
// neste aparelho (avatarStore).
export function AvatarCustomizerScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const displayName = user?.displayName ?? user?.username ?? '';
  const { config, save } = useMyAvatar();

  const baseline = useMemo(() => config ?? defaultAvatarConfig(), [config]);
  const [draft, setDraft] = useState<AvatarConfig>(() => config ?? defaultAvatarConfig());
  const [category, setCategory] = useState<CategoryId>('skin');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const touched = useRef(false);
  const allowLeave = useRef(false);

  // O avatar guardado termina de carregar depois de abrir a tela: se a pessoa
  // ainda não mexeu em nada, parte dele.
  useEffect(() => {
    if (config && !touched.current) setDraft(config);
  }, [config]);

  const dirty = !sameAvatarConfig(draft, baseline);

  // Sair com alterações não salvas pede confirmação (botão voltar, gesto e
  // botão voltar do Android).
  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!dirty || allowLeave.current) return;
      event.preventDefault();
      Alert.alert('Descartar alterações?', 'As mudanças no avatar não salvas serão perdidas.', [
        { text: 'Continuar editando', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
      ]);
    });
  }, [navigation, dirty]);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => navigation.goBack(), SAVED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [saved, navigation]);

  const tile = Math.floor((width - spacing.lg * 2 - spacing.sm * (OPTIONS_PER_ROW - 1)) / OPTIONS_PER_ROW);
  const rows = useMemo(() => buildPanelRows(category, draft.options), [category, draft.options]);

  const onSelect = useCallback<Select>((field, value) => {
    touched.current = true;
    setDraft((previous) => ({
      ...previous,
      options: { ...previous.options, [field]: value } as AvatarOptions,
    }));
  }, []);

  function handleRandom() {
    touched.current = true;
    setDraft(randomAvatarConfig());
  }

  function handleCancel() {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    Alert.alert('Descartar alterações?', 'As mudanças no avatar não salvas serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          allowLeave.current = true;
          navigation.goBack();
        },
      },
    ]);
  }

  async function handleSave() {
    if (saving || saved) return;
    setSaving(true);
    await save(draft);
    allowLeave.current = true;
    setSaving(false);
    setSaved(true);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <BackButton onPress={handleCancel} />
        <Text style={[styles.title, { color: tokens.text }]}>Personalizar avatar</Text>
      </View>

      <View style={styles.preview}>
        <Avatar config={draft} displayName={displayName} size={PREVIEW_SIZE} />
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          accessibilityRole="radiogroup"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((item) => (
            <ChoicePill
              key={item.id}
              variant="inverted"
              label={item.label}
              selected={category === item.id}
              onPress={() => setCategory(item.id)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={category}
        data={rows}
        extraData={draft}
        keyExtractor={(row) => row.key}
        renderItem={({ item }) => <PanelRowView row={item} draft={draft} tile={tile} onSelect={onSelect} />}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={5}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <Text style={[styles.credits, { color: tokens.textSecondary }]}>
            Avataaars, de Pablo Stanley (avataaars.com), gratuito para uso pessoal e comercial. Gerado no seu aparelho com a
            biblioteca DiceBear (licença MIT).
          </Text>
        }
        contentContainerStyle={styles.panel}
        style={styles.list}
      />

      {saved && (
        <Text accessibilityRole="alert" style={[styles.savedMessage, { color: tokens.primary }]}>
          Avatar salvo!
        </Text>
      )}

      <View style={styles.footer}>
        <Button
          label="Aleatório"
          variant="secondary"
          onPress={handleRandom}
          disabled={saved}
          accessibilityHint="Sorteia uma combinação de avatar"
          style={styles.footerButton}
        />
        <Button label="Cancelar" variant="secondary" onPress={handleCancel} disabled={saved} style={styles.footerButton} />
        <Button
          label="Salvar"
          onPress={handleSave}
          loading={saving}
          disabled={saved}
          accessibilityHint="Usa este avatar no seu perfil, neste aparelho"
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    borderRadius: BUBBLE_SIZE / 2 - 4,
    borderWidth: 1,
    height: BUBBLE_SIZE - 8,
    justifyContent: 'center',
    width: BUBBLE_SIZE - 8,
  },
  bubbleGlyph: { fontFamily: fontFamily(800), fontSize: 16 },
  bubbleHit: { alignItems: 'center', height: BUBBLE_SIZE, justifyContent: 'center', width: BUBBLE_SIZE },
  bubbleSelected: { borderWidth: 3 },
  bubbleTransparent: { borderStyle: 'dashed' },
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
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  chipsWrap: { flexGrow: 0, paddingVertical: spacing.sm },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  container: { flex: 1 },
  credits: { fontFamily: fontFamily(600), fontSize: 11, lineHeight: 16, marginTop: spacing.md },
  footer: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm },
  footerButton: { flex: 1, paddingHorizontal: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: { flex: 1 },
  note: { fontFamily: fontFamily(600), fontSize: 13 },
  optionsRow: { flexDirection: 'row' },
  panel: { gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm },
  preview: { alignItems: 'center', paddingVertical: spacing.sm },
  savedMessage: { fontFamily: fontFamily(800), fontSize: 14, textAlign: 'center' },
  sectionTitle: {
    fontFamily: fontFamily(800),
    fontSize: 12.5,
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  tile: {
    alignItems: 'center',
    borderRadius: radius.card / 2,
    borderWidth: TILE_BORDER,
    justifyContent: 'center',
  },
  tileFallback: { fontFamily: fontFamily(800), fontSize: 18 },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
});
