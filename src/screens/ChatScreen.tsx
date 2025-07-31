// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Pull in your chat hook and bubble component
import { useChat, Message } from "../hooks/useChat";
import ChatBubble from "../components/ChatBubble";

// Your logo asset
const logo = require("../assets/images/calio-orange-logo.png");

// Mock quick-access pills
const mockQuickTexts = [
  "What's for dinner?",
  "Lunch ideas?",
  "Local delivery finds",
  "Dinner for two?",
];

const { width } = Dimensions.get("window");
const LOGO_HEIGHT = 60;
const INPUT_BOTTOM = Platform.OS === "ios" ? 20 : 20;
const INPUT_WIDTH = width - 32;
const INPUT_BAR_HEIGHT = Platform.OS === "ios" ? 56 : 48;
const QUICK_GAP = 8;

// Full text to type out
const FULL_INTRO = "Hi Rishav!\nWhat are you in the mood for today?";

export default function ChatScreen() {
  const { messages, loading, sendMessage } = useChat();
  const [draft, setDraft] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  // Typing-intro state
  const [displayedText, setDisplayedText] = useState("");

  // Ref for FlatList to control scrolling
  const flatListRef = useRef<FlatList<Message>>(null);

  // ① Type-out the AI greeting on first load
  useEffect(() => {
    if (!hasStarted && messages.length > 0) {
      const full = messages[0].content;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      let idx = 1;
      const timer = setInterval(() => {
        if (idx <= full.length) {
          setDisplayedText(full.slice(0, idx));
          idx++;
        } else {
          clearInterval(timer);
        }
      }, 40);

      return () => clearInterval(timer);
    }
  }, [messages, hasStarted]);

  // When the user sends a message
  const onSend = () => {
    const text = draft.trim();
    if (!text || loading) return;
    if (!hasStarted) setHasStarted(true);
    sendMessage(text);
    setDraft("");
    // scroll to bottom after sending
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // adjust if you have navbars/headers above
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.container}>
        {/* ─── Top Bar ───────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity>
            <Ionicons name="time-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* ─── Logo ──────────────────────────────────────── */}
        <View style={styles.logoArea}>
          <Image source={logo} style={styles.logo} />
        </View>

        {/* ─── Main Content: intro+quick vs. chat log ────── */}
        <View style={[styles.textArea, hasStarted && styles.textAreaChat]}>
          {!hasStarted ? (
            <>
              {/* Typing intro */}
              <Text
                style={[
                  styles.introText,
                  {
                    marginBottom: INPUT_BAR_HEIGHT + QUICK_GAP,
                  },
                ]}
              >
                {displayedText}
              </Text>

              {/* Quick-access scroll */}
              <View
                style={[
                  styles.quickScrollWrapper,
                  {
                    bottom: INPUT_BOTTOM + INPUT_BAR_HEIGHT + QUICK_GAP,
                  },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickContainer}
                >
                  {mockQuickTexts.map((text, i) => (
                    <View key={i} style={styles.quickItemWrapper}>
                      <Text style={styles.quickText}>{text}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : (
            // Chat history
            <View
              style={[
                styles.chatContainer,
                {
                  paddingBottom: INPUT_BAR_HEIGHT + INPUT_BOTTOM,
                },
              ]}
            >
              <FlatList<Message>
                ref={flatListRef}
                data={messages}
                keyExtractor={(_, i) => String(i)}
                renderItem={({ item }) => (
                  <ChatBubble content={item.content} role={item.role} />
                )}
                style={styles.chatList}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              />
            </View>
          )}
        </View>

        {/* ─── Floating Input Bar ───────────────────────── */}
        <View style={[styles.inputWrapper, { bottom: INPUT_BOTTOM }]}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask something"
              placeholderTextColor="#666"
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                // keep scroll at bottom while typing
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              onFocus={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              editable={!loading}
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onSend}
              disabled={loading}
            >
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  logoArea: {
    position: "absolute",
    width,
    paddingTop: 45,
    height: LOGO_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  logo: { width: 80, height: 45, resizeMode: "contain" },

  textArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textAreaChat: {
    justifyContent: "flex-start",
    alignItems: "stretch",
  },

  introText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    lineHeight: 24,
    marginHorizontal: 16,
  },

  quickScrollWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: INPUT_BAR_HEIGHT + QUICK_GAP + INPUT_BOTTOM,
    height: 48,
    alignItems: "center",
  },
  quickContainer: { paddingHorizontal: 16, alignItems: "center" },
  quickItemWrapper: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    backgroundColor: "#FFF",
  },
  quickText: { fontSize: 14, color: "#333" },

  chatContainer: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: INPUT_BAR_HEIGHT + INPUT_BOTTOM,
  },
  chatList: { flex: 1 },
  chatContent: { paddingHorizontal: 16 },

  inputWrapper: {
    position: "absolute",
    width: INPUT_WIDTH,
    alignSelf: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
  },
  input: { flex: 1, fontSize: 16, color: "#000" },
  sendButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
});
