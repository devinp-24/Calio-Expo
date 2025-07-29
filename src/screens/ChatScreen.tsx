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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// Your logo asset
const logo = require("../assets/images/calio-orange-logo.png");

const mockQuickTexts = [
  "What's for dinner?",
  "Lunch ideas?",
  "Local delivery finds",
  "Dinner for two?",
];

const { width, height } = Dimensions.get("window");
const LOGO_HEIGHT = 60;
const INPUT_BOTTOM = Platform.OS === "ios" ? 100 : 70;
const INPUT_WIDTH = width - 32;
const INPUT_BAR_HEIGHT = Platform.OS === "ios" ? 56 : 48;
const QUICK_GAP = 8;

// the full text you want to “type out”
const FULL_INTRO = "Hi Rishav!\nWhat are you in the mood for today?";

export default function ChatScreen() {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // 1) Fire a light haptic tap once, when typing starts:
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let idx = 1; // start at 1 so slice(0,1) === "H"
    const timer = setInterval(() => {
      if (idx <= FULL_INTRO.length) {
        // Take the first `idx` characters from the string
        setDisplayedText(FULL_INTRO.slice(0, idx));
        idx++;
      } else {
        // Once we've shown the full string, stop
        clearInterval(timer);
      }
    }, 40); // 50ms per character—tweak for speed

    return () => clearInterval(timer);
  }, []);

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

      {/* Typing Intro */}
      <View style={styles.textArea}>
        <Text style={styles.introText}>{displayedText}</Text>
      </View>

      {/* Quick-Access Scroll */}
      <View style={styles.quickScrollWrapper}>
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

      {/* Floating Input Bar */}
      <View style={styles.inputWrapper}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask something"
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={styles.sendButton}>
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
  textArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  introText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    lineHeight: 24,
  },
  quickScrollWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: INPUT_BOTTOM + INPUT_BAR_HEIGHT + QUICK_GAP,
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
