// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Audio, InterruptionModeIOS } from "expo-av";

import { useChat, Message } from "../hooks/useChat";
import ChatBubble from "../components/ChatBubble";
import RestaurantCard from "../components/RestaurantCard";
import QuickPills from "../components/QuickPills";
import type { QuickPillsRef } from "../components/QuickPills";
import Constants from "expo-constants";

const logo = require("../assets/images/calio-orange-logo.png");

const { width } = Dimensions.get("window");
const LOGO_HEIGHT = 60;
const INPUT_BOTTOM = Platform.OS === "ios" ? 20 : 20;
const INPUT_WIDTH = width - 32;
const INPUT_BAR_HEIGHT = Platform.OS === "ios" ? 56 : 48;
const QUICK_GAP = 8; // ← spacing above input for quick pills

const { extra } = (Constants as any).manifest2 ?? (Constants as any).expoConfig ?? {};
const API_BASE: string = extra?.API_BASE ?? "http://192.168.3.142:3001/api";



// Quick-access mock texts (same as original)
// const mockQuickTexts = [
//   "What's for dinner?",
//   "Lunch ideas?",
//   "Local delivery finds",
//   "Dinner for two?",
// ];

type Card = {
  name: string;
  rating?: number;
  eta: number;
  imageUrl?: string;
};

type ChatItem =
  | { type: "message"; key: string; message: Message }
  | { type: "cards"; key: string; cards: Card[] }
  | { type: "voice"; key: string }; // details are looked up from voiceBlocks by key

const VoiceBubble: React.FC<{ uri: string; durationMs: number }> = ({ uri, durationMs }) => {
  const secs = Math.max(1, Math.round(durationMs / 1000));
  return (
    <View style={styles.voiceInner}>
      <Ionicons name="mic" size={16} color="#000" />
      <Text style={styles.voiceText}>{secs}s voice</Text>
    </View>
  );
};

export default function ChatScreen() {
  const {
    messages,
    loading,
    sendMessage,
    restaurantCards,
    selectRestaurant,
    quickPill,
    showNearbyOptions,
    showSurpriseMe,
    orderWithApp,
    handleAssistantButton,
  } = useChat();

  const [draft, setDraft] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const longPressActiveRef = useRef(false);

  const flatListRef = useRef<FlatList<ChatItem>>(null);
  const pills = useMemo(
    () => ["📍 Nearby", "🎲 Surprise me", ...(quickPill ? [quickPill] : [])],
    [quickPill]
  );

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

// Voice message items that appear in the chat list
type VoiceItem = { key: string; afterIndex: number; uri: string; durationMs: number };
const [voiceBlocks, setVoiceBlocks] = useState<VoiceItem[]>([]);

async function startRecording() {
  try {
    // Guard so we don’t double-start
    if (recording || isRecording) return;

    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) return;

    const mode: any = {
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    };
    if (Platform.OS === "ios" && (InterruptionModeIOS as any)?.DoNotMix != null) {
      mode.interruptionModeIOS = (InterruptionModeIOS as any).DoNotMix;
    }
    await Audio.setAudioModeAsync(mode);

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();

    setRecording(rec);
    setIsRecording(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (e) {
    console.warn("startRecording error:", e);
  }
}

async function transcribeAndSend(uri: string) {
  try {
    setIsTranscribing(true);

    const filename = uri.split("/").pop() ?? "audio.m4a";
    const form = new FormData();
    form.append("file", {
      uri,
      name: filename,
      type: "audio/m4a", // iOS m4a from HIGH_QUALITY preset
    } as any);

    const res = await fetch(`${API_BASE}/transcribe`, {
      method: "POST",
      // DO NOT set Content-Type here; let fetch set the multipart boundary.
      body: form,
    });

    const json = await res.json();
    const text: string = json?.text || json?.transcript || "";

    if (text) {
      if (!hasStarted) setHasStarted(true);
      sendMessage(text);
    } else {
      console.warn("No transcript returned");
    }
  } catch (e) {
    console.warn("transcribe error:", e);
  } finally {
    setIsTranscribing(false);
  }
}
const stoppingRef = useRef(false);

async function stopRecording() {
  if (!recording || stoppingRef.current) return;
  stoppingRef.current = true;

  try {
    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // already stopped is fine
    }

    const status = await recording.getStatusAsync();
    const uri = recording.getURI() || "";
    const durationMs = (status as any)?.durationMillis ?? 0;

    setRecording(null);
    setIsRecording(false);

    if (uri) {
      // optional: keep the bubble you already add
      // const afterIndex = Math.max(0, messages.length - 1);
      // setVoiceBlocks((prev) => [
      //   ...prev,
      //   { key: `voice-${Date.now()}-${prev.length}`, afterIndex, uri, durationMs },
      // ]);

      await transcribeAndSend(uri); // <-- await so we can clean up audio mode afterwards
    }
  } catch (e) {
    console.warn("stopRecording error:", e);
  } finally {
    // release audio mode on iOS so other audio resumes normally
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      } as any);
    } catch {}
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stoppingRef.current = false;
  }
}



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

    const afterIndex = messages.length - 1;
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

  const blocksByAfterIndex = useMemo(() => {
    const map = new Map<number, Array<{ key: string; cards: Card[] }>>();
    for (const b of cardBlocks) {
      if (!map.has(b.afterIndex)) map.set(b.afterIndex, []);
      map.get(b.afterIndex)!.push({ key: b.key, cards: b.cards });
    }
    return map;
  }, [cardBlocks]);

  const voicesByAfterIndex = useMemo(() => {
  const m = new Map<number, VoiceItem[]>();
  for (const v of voiceBlocks) {
    if (!m.has(v.afterIndex)) m.set(v.afterIndex, []);
    m.get(v.afterIndex)!.push(v);
  }
  return m;
}, [voiceBlocks]);


  // const chatData: ChatItem[] = useMemo(() => {
  //   const items: ChatItem[] = [];
  //   messages.forEach((m, i) => {
  //     items.push({ type: "message", key: `msg-${i}`, message: m });
  //     const blocks = blocksByAfterIndex.get(i);
  //     if (blocks && blocks.length) {
  //       for (const b of blocks) {
  //         items.push({ type: "cards", key: b.key, cards: b.cards });
  //       }
  //     }
  //   });
  //   return items;
  // }, [messages, blocksByAfterIndex]);

    const chatData: ChatItem[] = useMemo(() => {
      const items: ChatItem[] = [];
      messages.forEach((m, i) => {
        items.push({ type: "message", key: `msg-${i}`, message: m });

        const blocks = blocksByAfterIndex.get(i);
        if (blocks) {
          for (const b of blocks) items.push({ type: "cards", key: b.key, cards: b.cards });
        }

        const vbs = voicesByAfterIndex.get(i) || [];
        for (const v of vbs) items.push({ type: "voice", key: v.key });
      });
      return items;
    }, [messages, blocksByAfterIndex, voicesByAfterIndex]);


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

              {/* Quick-access pills */}
              <QuickPills
                items={pills}
                bottomOffset={INPUT_BOTTOM + INPUT_BAR_HEIGHT + QUICK_GAP}
                onPress={async (txt) => {
                  if (/nearby/i.test(txt)) {
                    if (!hasStarted) setHasStarted(true);
                    if (!loading) {
                      await Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                      );
                      await showNearbyOptions();
                      setTimeout(
                        () =>
                          flatListRef.current?.scrollToEnd({ animated: true }),
                        120
                      );
                    }
                    return;
                  }

                  if (/surprise/i.test(txt)) {
                    // 👈 NEW
                    if (!hasStarted) setHasStarted(true);
                    if (!loading) {
                      await Haptics.impactAsync(
                        Haptics.ImpactFeedbackStyle.Medium
                      );
                      await showSurpriseMe();
                      setTimeout(
                        () =>
                          flatListRef.current?.scrollToEnd({ animated: true }),
                        120
                      );
                    }
                    return;
                  }

                  sendNow(txt);
                }}
              />
            </>
          ) : (
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
                        buttons={item.message.buttons}
                        onButtonPress={(val) => handleAssistantButton(val)} // 👈 from the hook
                      />
                    );
                  }
                  if (item.type === "voice") {
                  const vb = voiceBlocks.find((v) => v.key === item.key);
                  if (!vb) return null;
                  return (
                    <View style={{ paddingHorizontal: 16, marginVertical: 6, alignItems: "flex-end" }}>
                      <View style={styles.voiceBubble}>
                        <VoiceBubble uri={vb.uri} durationMs={vb.durationMs} />
                      </View>
                    </View>
                  );
                }

                // item.type === "cards"
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
                          onOrderPress={isLatest ? () => selectRestaurant(index) : undefined}
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
            {/* <TouchableOpacity
              style={styles.sendButton}
              onPress={onSend}
              disabled={loading}
            >
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[styles.sendButton, (isRecording || isTranscribing) && styles.sendButtonRecording]}
              onPress={() => {
                if (isRecording || isTranscribing) return;
                onSend();
              }}
              onLongPress={startRecording}
              onPressOut={stopRecording}
              delayLongPress={300}
              disabled={loading || isTranscribing}
            >
              <Ionicons name={isRecording ? "mic" : (isTranscribing ? "time" : "arrow-up")} size={18} color="#FFF" />
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
  },
  chatContent: {
    paddingHorizontal: 16,
  },

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
  voiceBubble: {
    maxWidth: "80%",
    backgroundColor: "#E0F7FA",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  voiceInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceText: {
    color: "#000",
    fontWeight: "600",
  },
  sendButtonRecording: {
    backgroundColor: "#E53935",
  },
});
