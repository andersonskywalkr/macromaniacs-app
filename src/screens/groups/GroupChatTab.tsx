import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { GroupFeedItem } from '@/api/types/domain';
import { sendGroupMessage } from '@/api/groups';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing, touchTarget } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SendIcon } from '@/components/icons';
import { groupFeedKey, useGroupFeed } from '@/queries/useGroupFeed';
import { useAuthStore } from '@/store/authStore';
import {
  buildChatRows,
  isMealShare,
  MAX_MESSAGE_LENGTH,
  MESSAGE_WARNING_LENGTH,
  type ChatRow,
} from '@/utils/chat';
import { formatTime } from '@/utils/meals';
import { resolveTimezone } from '@/utils/today';
import { canSendMessage } from '@/validation/groups';

interface GroupChatTabProps {
  groupId: string;
  // true com a aba Chat aberta E a tela em foco: liga a atualização de 15 s.
  live: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string | null;
  mealShare: boolean;
  createdAt: string;
  status?: 'sending' | 'failed';
}

function fromFeedItem(item: GroupFeedItem): ChatMessage {
  return {
    id: item.id,
    userId: item.userId,
    displayName: item.displayName,
    content: item.content,
    mealShare: isMealShare(item),
    createdAt: item.createdAt,
  };
}

function MessageBubble({
  message,
  isMe,
  onRetry,
}: {
  message: ChatMessage;
  isMe: boolean;
  onRetry: (id: string) => void;
}) {
  const { tokens } = useTheme();
  const text = message.mealShare ? 'compartilhou uma refeição' : (message.content ?? '');

  const bubble = (
    <View
      style={[
        styles.bubble,
        isMe ? styles.myBubble : styles.otherBubble,
        { backgroundColor: isMe ? `${tokens.primary}33` : tokens.card },
      ]}
    >
      {!isMe && (
        <Text numberOfLines={1} style={[styles.senderName, { color: tokens.primary }]}>
          {message.displayName}
        </Text>
      )}
      <Text style={[message.mealShare ? styles.mealShare : styles.messageText, { color: tokens.text }]}>
        {text}
      </Text>
      <View style={styles.metaRow}>
        {message.status === 'sending' && (
          <Text style={[styles.messageTime, { color: tokens.textSecondary }]}>Enviando…</Text>
        )}
        {message.status === 'failed' && (
          <Text accessibilityRole="alert" style={[styles.messageTime, { color: tokens.danger }]}>
            Não enviada
          </Text>
        )}
        {!message.status && (
          <Text style={[styles.messageTime, { color: tokens.textSecondary }]}>
            {formatTime(message.createdAt)}
          </Text>
        )}
      </View>
      {message.status === 'failed' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tentar de novo"
          hitSlop={8}
          onPress={() => onRetry(message.id)}
          style={styles.retry}
        >
          <Text style={[styles.retryLabel, { color: tokens.primary }]}>Tentar de novo</Text>
        </Pressable>
      )}
    </View>
  );

  if (isMe) {
    return (
      <View style={styles.myRow}>
        {bubble}
        <Avatar uri={null} displayName={message.displayName} size={34} />
      </View>
    );
  }
  return (
    <View style={styles.otherRow}>
      <Avatar uri={null} displayName={message.displayName} size={34} />
      {bubble}
    </View>
  );
}

// Aba Chat. O chat usa o FEED do grupo (cada mensagem é uma postagem de
// texto). Envio otimista: a mensagem aparece na hora; se falhar, mostra "Não
// enviada" com "Tentar de novo".
export function GroupChatTab({ groupId, live }: GroupChatTabProps) {
  const { tokens } = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const timezone = resolveTimezone(user?.timezone);
  const feed = useGroupFeed(groupId, live);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<ChatRow<ChatMessage>>>(null);
  const currentUserId = user?.id;

  const rows = useMemo(
    () => buildChatRows([...(feed.data ?? []).map(fromFeedItem), ...pending], timezone),
    [feed.data, pending, timezone],
  );

  // Rola para a mensagem mais recente quando chega mensagem nova.
  const messageCount = rows.filter((row) => row.type === 'message').length;
  useEffect(() => {
    if (messageCount > 0) listRef.current?.scrollToEnd({ animated: false });
  }, [messageCount]);

  async function deliver(id: string, content: string) {
    try {
      const sent = await sendGroupMessage(groupId, content);
      const key = groupFeedKey(groupId);
      const cached = queryClient.getQueryData<GroupFeedItem[]>(key);
      if (cached) {
        if (!cached.some((item) => item.id === sent.id)) {
          queryClient.setQueryData<GroupFeedItem[]>(key, [...cached, sent]);
        }
      } else {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      setPending((current) => current.filter((message) => message.id !== id));
    } catch {
      setPending((current) =>
        current.map((message) => (message.id === id ? { ...message, status: 'failed' } : message)),
      );
    }
  }

  function handleSend() {
    if (!canSendMessage(text)) return;
    const content = text.trim();
    const id = `pending-${Date.now()}-${pending.length}`;
    setPending((current) => [
      ...current,
      {
        id,
        userId: currentUserId ?? '',
        displayName: user?.displayName ?? user?.username ?? 'Você',
        content,
        mealShare: false,
        createdAt: new Date().toISOString(),
        status: 'sending',
      },
    ]);
    setText('');
    void deliver(id, content);
  }

  function handleRetry(id: string) {
    const message = pending.find((item) => item.id === id);
    if (!message?.content) return;
    setPending((current) =>
      current.map((item) => (item.id === id ? { ...item, status: 'sending' } : item)),
    );
    void deliver(id, message.content);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await feed.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  if (feed.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando mensagens" />
      </View>
    );
  }

  if (feed.isError && !feed.data) {
    return (
      <View style={styles.centered}>
        <EmptyState
          title="Não foi possível carregar o chat"
          description="Verifique sua conexão e tente novamente."
        />
        <Button label="Tentar de novo" onPress={() => feed.refetch()} style={styles.fullWidth} />
      </View>
    );
  }

  const length = text.length;
  const canSend = canSendMessage(text);
  const sendButtonColors = { backgroundColor: tokens.primary, opacity: canSend ? 1 : 0.4 };

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: tokens.text }]}>Nenhuma mensagem ainda.</Text>
            <Text style={[styles.emptySub, { color: tokens.textSecondary }]}>
              Seja o primeiro a enviar mensagem!
            </Text>
          </View>
        }
        renderItem={({ item: row }) =>
          row.type === 'separator' ? (
            <View style={styles.dateBadgeContainer}>
              <View style={[styles.dateBadge, { backgroundColor: tokens.card }]}>
                <Text style={[styles.dateText, { color: tokens.text }]}>{row.label}</Text>
              </View>
            </View>
          ) : (
            <MessageBubble
              message={row.message}
              isMe={row.message.userId === currentUserId}
              onRetry={handleRetry}
            />
          )
        }
      />

      {length >= MESSAGE_WARNING_LENGTH && (
        <Text
          accessibilityRole="alert"
          style={[styles.counter, { color: length >= MAX_MESSAGE_LENGTH ? tokens.danger : tokens.textSecondary }]}
        >
          {length >= MAX_MESSAGE_LENGTH
            ? `Limite de ${MAX_MESSAGE_LENGTH} caracteres atingido`
            : `${length}/${MAX_MESSAGE_LENGTH} caracteres`}
        </Text>
      )}

      <View style={[styles.inputBar, { backgroundColor: tokens.background, borderTopColor: tokens.track }]}>
        <View style={[styles.inputWrapper, { backgroundColor: tokens.card }]}>
          <TextInput
            accessibilityLabel="Mensagem"
            placeholder="Mensagem..."
            placeholderTextColor={tokens.textSecondary}
            style={[styles.input, { color: tokens.text }]}
            value={text}
            onChangeText={setText}
            maxLength={MAX_MESSAGE_LENGTH}
            multiline
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          hitSlop={4}
          onPress={handleSend}
          style={[styles.sendButton, sendButtonColors]}
        >
          <SendIcon size={18} color={tokens.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { borderRadius: 16, maxWidth: '74%', paddingHorizontal: 14, paddingVertical: 10 },
  centered: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  container: { flex: 1 },
  counter: {
    fontFamily: fontFamily(600),
    fontSize: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    textAlign: 'right',
  },
  dateBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 3 },
  dateBadgeContainer: { alignItems: 'center', marginVertical: 14 },
  dateText: { fontFamily: fontFamily(600), fontSize: 11 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptySub: { fontFamily: fontFamily(500), fontSize: 14, marginTop: 4 },
  emptyTitle: { fontFamily: fontFamily(600), fontSize: 16 },
  fullWidth: { alignSelf: 'stretch' },
  input: { fontFamily: fontFamily(500), fontSize: 14, maxHeight: 96, padding: 0, paddingVertical: 10 },
  inputBar: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputWrapper: {
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minSize,
    paddingHorizontal: 14,
  },
  listContent: { flexGrow: 1, paddingBottom: spacing.md, paddingHorizontal: spacing.md },
  mealShare: { fontFamily: fontFamily(600), fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  messageText: { fontFamily: fontFamily(500), fontSize: 13.5, lineHeight: 19 },
  messageTime: { fontFamily: fontFamily(500), fontSize: 10.5 },
  metaRow: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', marginTop: 4 },
  myBubble: { marginRight: spacing.sm },
  myRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
  },
  otherBubble: { marginLeft: spacing.sm },
  otherRow: { alignItems: 'flex-end', flexDirection: 'row', marginBottom: spacing.md },
  retry: { justifyContent: 'center', minHeight: touchTarget.minSize },
  retryLabel: { fontFamily: fontFamily(800), fontSize: 13 },
  sendButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: touchTarget.minSize,
    justifyContent: 'center',
    width: touchTarget.minSize,
  },
  senderName: { fontFamily: fontFamily(700), fontSize: 12, marginBottom: 2 },
});
