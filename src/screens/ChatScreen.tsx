import React from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QuickAccessButton from "../components/QuickAccessButton";

// put your real logo in /assets/logo.png
const logo = require("../../assets/logo.png");

const mockQuickTexts = [
  "What's for dinner?",
  "Lunch ideas?",
  "Local delivery finds",
  "Dinner for two?",
];

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Top Bar ───────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            /* TODO: open history */
          }}
        >
          <Ionicons name="time-outline" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            /* TODO: share */
          }}
        >
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* ─── Logo ──────────────────────────────────────── */}
      <View style={styles.logoWrapper}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      {/* ─── Quick-Access Buttons ─────────────────────── */}
      <View style={styles.quickContainer}>
        {mockQuickTexts.map((text, i) => (
          <QuickAccessButton key={i} label={text} onPress={() => {}} />
        ))}
      </View>

      {/* ─── Chat Input Bar ───────────────────────────── */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask something"
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => {}}>
          <Ionicons name="arrow-up" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");
const H_PADDING = 16;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    paddingVertical: 12,
  },

  logoWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.5,
    height: width * 0.2,
  },

  quickContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    marginBottom: 12,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PADDING,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderTopWidth: 1,
    borderColor: "#EEE",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 10,
  },
});
