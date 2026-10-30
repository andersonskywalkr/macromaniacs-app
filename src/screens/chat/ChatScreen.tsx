import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  sender?: string;
  text?: string;
  imageUri?: string;
  time: string;
  isMe: boolean;
  avatar?: string;
}

// Foto padrão com iniciais (ex: "EU" ou "FL" com fundo roxo combinando com o tema)
const DEFAULT_USER_AVATAR =
  "https://ui-avatars.com/api/?name=Felipe&background=6D28D9&color=fff&size=128&rounded=true";
const DEFAULT_GROUP_AVATAR =
  "https://ui-avatars.com/api/?name=TI&background=6D28D9&color=fff&size=128&rounded=true";

export default function Index() {
  const [activeTab, setActiveTab] = useState("Chat");
  const [inputText, setInputText] = useState("");
  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);
  const [groupAvatar, setGroupAvatar] = useState<string>(DEFAULT_GROUP_AVATAR);
  const [groupDescription, setGroupDescription] = useState(
    "Onde os fracos não tem vez.",
  );
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pickImage = async (setAvatar: (uri: string) => void) => {
    try {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted)
        return Alert.alert("Permissão", "Permita o acesso às suas fotos.");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) setAvatar(result.assets[0].uri);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar a imagem.");
    }
  };

  const pickImageForChat = async () => {
    try {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted)
        return Alert.alert("Permissão", "Permita o acesso às fotos.");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const now = new Date();
        const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "Você",
            imageUri: result.assets[0].uri,
            time,
            isMe: true,
          },
        ]);
      }
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a imagem.");
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "Você",
        text: inputText.trim(),
        time,
        isMe: true,
      },
    ]);
    setInputText("");
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    if (item.isMe) {
      return (
        <View style={styles.myMessageRow}>
          <View style={[styles.bubble, styles.myBubble]}>
            {item.imageUri && (
              <Image source={{ uri: item.imageUri }} style={styles.chatImage} />
            )}
            {item.text ? (
              <Text style={styles.messageText}>{item.text}</Text>
            ) : null}
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
          {/* Clicar na sua foto ao lado da mensagem abre a galeria para alterá-la */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => pickImage(setUserAvatar)}
          >
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.otherMessageRow}>
        <Image
          source={{ uri: item.avatar || DEFAULT_USER_AVATAR }}
          style={styles.avatar}
        />
        <View style={[styles.bubble, styles.otherBubble]}>
          <View style={styles.otherBubbleHeader}>
            <Text style={styles.senderName}>{item.sender}</Text>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
          {item.imageUri && (
            <Image source={{ uri: item.imageUri }} style={styles.chatImage} />
          )}
          {item.text ? (
            <Text style={styles.messageText}>{item.text}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.headerLeftButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
            <Text style={styles.headerTitle}>Grupos</Text>
          </TouchableOpacity>
          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="moon" size={20} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="settings" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.groupCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => pickImage(setGroupAvatar)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Image
                    source={{ uri: groupAvatar }}
                    style={styles.groupAvatar}
                  />
                  <View style={styles.editBadge}>
                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupTitle}>Os cara do TI</Text>
                  <Text style={styles.groupMembers}>9 membros</Text>
                  {isEditingDescription ? (
                    <TextInput
                      style={styles.groupTaglineInput}
                      value={groupDescription}
                      onChangeText={setGroupDescription}
                      onBlur={() => setIsEditingDescription(false)}
                      onSubmitEditing={() => setIsEditingDescription(false)}
                      placeholder="Adicione uma descrição..."
                      placeholderTextColor="#9CA3AF"
                      autoFocus
                      returnKeyType="done"
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setIsEditingDescription(true)}
                      style={styles.descriptionRow}
                    >
                      <Text style={styles.groupTagline} numberOfLines={2}>
                        {groupDescription ||
                          "Toque para adicionar uma descrição..."}
                      </Text>
                      <Feather
                        name="edit-2"
                        size={12}
                        color="#6B7280"
                        style={{ marginLeft: 6 }}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.tabsRow}>
                {["Ranking", "Chat", "Metas", "Sobre"].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[
                      styles.tabItem,
                      activeTab === tab && styles.activeTabItem,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab
                          ? styles.activeTabText
                          : styles.inactiveTabText,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {messages.length > 0 && (
                <View style={styles.dateBadgeContainer}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>Hoje</Text>
                  </View>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>Nenhuma mensagem ainda.</Text>
              <Text style={styles.emptyStateSubText}>
                Seja o primeiro a enviar mensagem!
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickImageForChat}
          >
            <Feather name="paperclip" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.textInputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Mensagem..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Ionicons
              name="send"
              size={17}
              color="#FFFFFF"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        {!isKeyboardVisible && (
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem}>
              <Feather name="home" size={22} color="#6B7280" />
              <Text style={styles.navLabel}>Início</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <MaterialCommunityIcons
                name="clock-time-four-outline"
                size={22}
                color="#6B7280"
              />
              <Text style={styles.navLabel}>Refeições</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <View style={styles.activeNavIndicator}>
                <Feather name="users" size={20} color="#6D28D9" />
              </View>
              <Text
                style={[
                  styles.navLabel,
                  { color: "#6D28D9", fontWeight: "600" },
                ]}
              >
                Grupo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <Feather name="user" size={22} color="#6B7280" />
              <Text style={styles.navLabel}>Perfil</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeftButton: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 4,
  },
  headerRightActions: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 },
  emptyStateContainer: { marginTop: 40, alignItems: "center" },
  emptyStateText: { fontSize: 16, color: "#4B5563", fontWeight: "600" },
  emptyStateSubText: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  groupCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  groupAvatar: { width: 56, height: 56, borderRadius: 28 },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6D28D9",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  groupInfo: { flex: 1, marginLeft: 14 },
  groupTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  groupMembers: { fontSize: 13, color: "#6B7280", marginTop: 1 },
  descriptionRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  groupTagline: { fontSize: 13, color: "#4B5563", flexShrink: 1 },
  groupTaglineInput: {
    fontSize: 13,
    color: "#111827",
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#6D28D9",
    paddingVertical: 2,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 4,
  },
  tabItem: { paddingBottom: 8, paddingHorizontal: 8 },
  activeTabItem: { borderBottomWidth: 2, borderBottomColor: "#6D28D9" },
  tabText: { fontSize: 15 },
  activeTabText: { color: "#6D28D9", fontWeight: "700" },
  inactiveTabText: { color: "#6B7280", fontWeight: "500" },
  dateBadgeContainer: { alignItems: "center", marginVertical: 14 },
  dateBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dateText: { fontSize: 11, color: "#1F2937", fontWeight: "600" },
  otherMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  myMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  bubble: {
    maxWidth: "74%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  otherBubble: { backgroundColor: "#F9FAFB", marginLeft: 10 },
  myBubble: { backgroundColor: "#DDD6FE", marginRight: 10 },
  otherBubbleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6D28D9",
    marginRight: 16,
  },
  messageText: { fontSize: 13, color: "#111827", lineHeight: 18 },
  chatImage: { width: 220, height: 220, borderRadius: 12, marginBottom: 6 },
  messageTime: {
    fontSize: 10,
    color: "#6B7280",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    paddingHorizontal: 14,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: "center",
    marginHorizontal: 8,
  },
  textInput: {
    fontSize: 14,
    color: "#111827",
    padding: 0,
    paddingVertical: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6D28D9",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  navItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  activeNavIndicator: {
    backgroundColor: "#EDE9FE",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 3,
    marginBottom: 2,
  },
  navLabel: { fontSize: 10, color: "#6B7280", marginTop: 2 },
});
