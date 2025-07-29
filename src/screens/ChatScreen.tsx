// src/screens/ChatScreen.tsx
import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Keyboard } from "react-native";

// Pull in your hook and bubble component
import { useChat, Message } from "../hooks/useChat";
import ChatBubble from "../components/ChatBubble";

// Your logo asset
const logo = require("../assets/images/calio-orange-logo.png");

// Mock quick‑access pills
const mockQuickTexts = [
  "What's for dinner?",
  "Lunch ideas?",
  "Local delivery finds",
  "Dinner for two?",
];

const { width } = Dimensions.get("window");
const LOGO_HEIGHT = 60;
const INPUT_BOTTOM = Platform.OS === "ios" ? 50 : 20;
const INPUT_WIDTH = width - 32;
const INPUT_BAR_HEIGHT = Platform.OS === "ios" ? 56 : 48;
const QUICK_GAP = 8;

export default function ChatScreen() {
  const { messages, loading, sendMessage } = useChat();
  const [draft, setDraft] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  // For typing effect of the AI greeting
  const [displayedText, setDisplayedText] = useState("");
  const [kbdHeight, setKbdHeight] = useState(0);

  // Kick off the haptic + typing animation once the greeting arrives
  useEffect(() => {
    // Only run if we haven't started the chat and we have a greeting
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

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKbdHeight(e.endCoordinates.height - 100)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKbdHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // When the user taps Send...
  const onSend = () => {
    const text = draft.trim();
    if (!text || loading) return;
    if (!hasStarted) setHasStarted(true);
    sendMessage(text);
    setDraft("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Ionicons name="time-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View style={styles.logoArea}>
        <Image source={logo} style={styles.logo} />
      </View>

      {/* textArea: BEFORE vs AFTER user starts chat */}
      <View style={[styles.textArea, hasStarted && styles.textAreaChat]}>
        {!hasStarted ? (
          <>
            {/* ① Typing intro of the real AI greeting */}
            <Text
              style={[
                styles.introText,
                { marginBottom: INPUT_BAR_HEIGHT + QUICK_GAP + kbdHeight },
              ]}
            >
              {displayedText}
            </Text>

            {/* ② Quick‑access scroll (unchanged) */}
            <View
              style={[
                styles.quickScrollWrapper,
                {
                  bottom:
                    INPUT_BOTTOM + INPUT_BAR_HEIGHT + QUICK_GAP + kbdHeight,
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
          /* CHAT MODE: render *all* messages top→bottom */
          <View style={styles.chatContainer}>
            <FlatList<Message>
              data={messages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <ChatBubble content={item.content} role={item.role} />
              )}
              style={styles.chatList}
              contentContainerStyle={styles.chatContent}
            />
          </View>
        )}
      </View>

      {/* Floating Input Bar (always present) */}
      <View
        style={[
          styles.inputWrapper,
          {
            // lift it up by exactly the keyboard height
            bottom: INPUT_BOTTOM + kbdHeight,
          },
        ]}
      >
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask something"
            placeholderTextColor="#666"
            value={draft}
            onChangeText={setDraft}
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

  // textArea styles
  textArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textAreaChat: {
    justifyContent: "flex-start",
    alignItems: "stretch",
  },

  // Typing intro text
  introText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    lineHeight: 24,
    marginHorizontal: 16,
  },

  // Chat container sits between logo and input bar
  chatContainer: {
    flex: 1,
    paddingTop: LOGO_HEIGHT + 16,
    paddingBottom: INPUT_BAR_HEIGHT + 24,
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
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

  inputWrapper: {
    position: "absolute",
    bottom: INPUT_BOTTOM,
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
