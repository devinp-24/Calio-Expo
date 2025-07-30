// components/ChatBubble.tsx
import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

export type ChatBubbleProps = {
  content: string;
  role: "assistant" | "user" | "system";
  timestamp?: string;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  role,
  timestamp,
}) => {
  const isUser = role === "user";
  const author = isUser ? "You" : "Calio";

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
  tsRow: {
    marginTop: 2,
    flexDirection: "row",
  },
  tsBot: { justifyContent: "flex-start" },
  tsUser: { justifyContent: "flex-end" },
  timestamp: { fontSize: 10, color: "#888" },
});
