// components/ChatBubble.tsx
import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity, Linking } from "react-native";
import { useSmartLink } from "../hooks/useSmartLink";
import type { Button as ChatButton } from "../hooks/useChat";

export type ChatBubbleProps = {
  content: string;
  role: "assistant" | "user" | "system";
  timestamp?: string;
  buttons?: ChatButton[]; //added new
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  role,
  timestamp,
  buttons,
}) => {
  const isUser = role === "user";
  const author = isUser ? "You" : "Calio";
  const { openAppOrStore } = useSmartLink();

  return (
    <View style={styles.wrapper}>
      {/* Author label, left for bot, right for user */}
      <View
        style={[styles.header, isUser ? styles.headerUser : styles.headerBot]}
      >
        <Text style={styles.author}>{author}</Text>
      </View>

      {/* Message bubble */}
      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}
      >
        <Text
          style={[
            styles.content,
            isUser ? styles.contentUser : styles.contentBot,
          ]}
        >
          {content}
        </Text>
        {/* Branded action buttons (assistant only) */}
        {!isUser && buttons?.length ? (
          <View style={styles.btnRow}>
            {buttons.map((b, i) => {
              const onPress = async () => {
                if (b.appTargets?.length) await openAppOrStore(b.appTargets);
                else if (b.url) Linking.openURL(b.url);
              };
              if (b.style === "brand-ubereats") {
                return (
                  <TouchableOpacity key={i} style={styles.ueBtn} activeOpacity={0.9} onPress={onPress}>
                    <Text style={styles.uePrefix}>Order with </Text>
                    <Text style={styles.ueUber}>Uber </Text>
                    <Text style={styles.ueEats}>Eats</Text>
                  </TouchableOpacity>
                );
              }
              if (b.style === "brand-doordash") {
                return (
                  <TouchableOpacity key={i} style={styles.ddBtn} activeOpacity={0.9} onPress={onPress}>
                    <Text style={styles.ddText}>Order with DoorDash</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={i} style={styles.defaultBtn} onPress={onPress}>
                  <Text style={styles.defaultText}>{b.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Optional timestamp under author, if you need it */}
      {timestamp && (
        <View style={[styles.tsRow, isUser ? styles.tsUser : styles.tsBot]}>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      )}
    </View>
  );
};

export default ChatBubble;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    marginBottom: 4,
  },
  headerBot: {
    justifyContent: "flex-start",
  },
  headerUser: {
    justifyContent: "flex-end",
  },
  author: {
    fontSize: 12,
    fontWeight: "500",
    color: "#555",
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bubbleBot: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 4,
    backgroundColor: "#FFF3E0",
    alignSelf: "flex-start",
  },
  bubbleUser: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 18,
    backgroundColor: "#E0F7FA",
    alignSelf: "flex-end",
  },
  content: {
    fontSize: 16,
    lineHeight: 20,
  },
  contentBot: { color: "#333" },
  contentUser: { color: "#000" },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 10,
  },
  // Uber Eats: black bg, "Eats" in green
  ueBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  uePrefix: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  ueUber:   { color: "#FFF", fontSize: 14, fontWeight: "800" },
  ueEats:   { color: "#06C167", fontSize: 14, fontWeight: "800" },
  // DoorDash: red bg, white text
  ddBtn: {
    backgroundColor: "#EB1700",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  ddText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  // default
  defaultBtn: {
    backgroundColor: "#ff5a1f",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  defaultText: { color: "#fff", fontWeight: "700" },
  tsRow: {
    marginTop: 2,
    flexDirection: "row",
  },
  tsBot: { justifyContent: "flex-start" },
  tsUser: { justifyContent: "flex-end" },
  timestamp: { fontSize: 10, color: "#888" },
});
