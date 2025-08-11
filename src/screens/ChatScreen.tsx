// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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
  FlatList,
  KeyboardAvoidingView,
  ScrollView, // ← re-added for quick pills
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useChat, Message } from "../hooks/useChat";
import ChatBubble from "../components/ChatBubble";
import RestaurantCard from "../components/RestaurantCard";
import QuickPills from "../components/QuickPills";
import type { QuickPillsRef } from "../components/QuickPills";

const logo = require("../assets/images/calio-orange-logo.png");

const { width } = Dimensions.get("window");
const LOGO_HEIGHT = 60;
const INPUT_BOTTOM = Platform.OS === "ios" ? 20 : 20;
const INPUT_WIDTH = width - 32;
const INPUT_BAR_HEIGHT = Platform.OS === "ios" ? 56 : 48;
const QUICK_GAP = 8; // ← spacing above input for quick pills

// Quick-access mock texts (same as original)
const mockQuickTexts = [
  "What's for dinner?",
  "Lunch ideas?",
  "Local delivery finds",
  "Dinner for two?",
];

type Card = {
  name: string;
  rating?: number;
  eta: number;
  imageUrl?: string;
};

type ChatItem =
  | { type: "message"; key: string; message: Message }
  | { type: "cards"; key: string; cards: Card[] };

export default function ChatScreen() {
  const { messages, loading, sendMessage, restaurantCards, selectRestaurant } =
    useChat();

  const [draft, setDraft] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [displayedText, setDisplayedText] = useState("");

  const flatListRef = useRef<FlatList<ChatItem>>(null);

  /** Maintain blocks of restaurant cards, each anchored after the message present at creation time */
  const [cardBlocks, setCardBlocks] = useState<
    Array<{ key: string; afterIndex: number; cards: Card[] }>
  >([]);
  const lastSignature = useRef<string | null>(null);

  const sendNow = (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    if (!hasStarted) setHasStarted(true);
    setDraft(t); // show it in the input
    sendMessage(t); // send immediately
    setDraft(""); // clear input after sending
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
  };

  // Append a new card block when restaurantCards changes (avoid duplicate inserts)
  useEffect(() => {
    if (!restaurantCards || restaurantCards.length === 0) return;

    const sig = JSON.stringify(
      restaurantCards.map((c) => ({
        n: c.name,
        r: c.rating ?? null,
        e: c.eta,
        u: c.imageUrl ?? null,
      }))
    );
    if (sig === lastSignature.current) return;
    lastSignature.current = sig;

    const afterIndex = messages.length - 1; // anchor after the latest AI message now
    setCardBlocks((prev) => [
      ...prev,
      {
        key: `cards-${Date.now()}-${prev.length}`,
        afterIndex,
        cards: restaurantCards,
      },
    ]);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [restaurantCards, messages.length]);

  // Type-out intro from the first AI message
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

  const onSend = () => {
    const t = draft.trim();
    if (!t || loading) return;
    if (!hasStarted) setHasStarted(true);
    sendMessage(t);
    setDraft("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Map: messageIndex -> list of blocks to insert after it
  const blocksByAfterIndex = useMemo(() => {
    const map = new Map<number, Array<{ key: string; cards: Card[] }>>();
    for (const b of cardBlocks) {
      if (!map.has(b.afterIndex)) map.set(b.afterIndex, []);
      map.get(b.afterIndex)!.push({ key: b.key, cards: b.cards });
    }
    return map;
  }, [cardBlocks]);

  // Merge messages with their card blocks
  const chatData: ChatItem[] = useMemo(() => {
    const items: ChatItem[] = [];
    messages.forEach((m, i) => {
      items.push({ type: "message", key: `msg-${i}`, message: m });
      const blocks = blocksByAfterIndex.get(i);
      if (blocks && blocks.length) {
        for (const b of blocks) {
          items.push({ type: "cards", key: b.key, cards: b.cards });
        }
      }
    });
    return items;
  }, [messages, blocksByAfterIndex]);

  // Only the most recent card block should be interactive
  const latestBlockKey = cardBlocks.length
    ? cardBlocks[cardBlocks.length - 1].key
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <SafeAreaView style={styles.container}>
        {/* Top bar */}
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

        {/* Content area */}
        <View style={[styles.textArea, hasStarted && styles.textAreaChat]}>
          {!hasStarted ? (
            <>
              {/* Intro text */}
              <Text
                style={[
                  styles.introText,
                  { marginBottom: INPUT_BAR_HEIGHT + QUICK_GAP },
                ]}
              >
                {displayedText}
              </Text>

              {/* Quick-access pills (re-added) */}
              <QuickPills
                items={mockQuickTexts} // today: static list
                bottomOffset={INPUT_BOTTOM + INPUT_BAR_HEIGHT + QUICK_GAP}
                onPress={(txt) => {
                  sendNow(txt);
                  // optional: auto-send
                  // setHasStarted(true); sendMessage(txt);
                }}
              />
            </>
          ) : (
            // Chat history + injected restaurant card blocks
            <View
              style={[
                styles.chatContainer,
                { paddingBottom: INPUT_BAR_HEIGHT + INPUT_BOTTOM },
              ]}
            >
              <FlatList<ChatItem>
                ref={flatListRef}
                data={chatData}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
                renderItem={({ item }) => {
                  if (item.type === "message") {
                    return (
                      <ChatBubble
                        content={item.message.content}
                        role={item.message.role}
                      />
                    );
                  }
                  const isLatest = item.key === latestBlockKey;
                  return (
                    <View style={styles.cardBlock}>
                      <FlatList
                        data={item.cards}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(_, idx) => `${item.key}-c${idx}`}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        renderItem={({ item: c, index }) => (
                          <RestaurantCard
                            name={c.name}
                            rating={c.rating}
                            eta={c.eta}
                            imageUrl={c.imageUrl}
                            onOrderPress={
                              isLatest
                                ? () => selectRestaurant(index)
                                : undefined
                            }
                          />
                        )}
                      />
                    </View>
                  );
                }}
              />
            </View>
          )}
        </View>

        {/* Input bar */}
        <View style={[styles.inputWrapper, { bottom: INPUT_BOTTOM }]}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask something"
              placeholderTextColor="#666"
              value={draft}
              onChangeText={(t) => {
                setDraft(t);
                flatListRef.current?.scrollToEnd({ animated: false });
              }}
              onSubmitEditing={onSend}
              returnKeyType="send"
              editable={!loading}
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

  // Quick pills (same look as before)
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
  },
  chatContent: {
    paddingHorizontal: 16,
  },

  // Card block row under a message
  cardBlock: {
    height: 180,
    marginVertical: 8,
  },

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
