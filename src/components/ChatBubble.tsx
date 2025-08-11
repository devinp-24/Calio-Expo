// components/ChatBubble.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
} from "react-native";

export type ChatBubbleButton = {
  label: string;
  value?: string; // "uber-eats" | "doordash" | custom
  url?: string; // optional generic URL fallback
  style?: string; // "primary" | "secondary" (unused here, we color by vendor)
};

export type ChatBubbleProps = {
  content: string;
  role: "assistant" | "user" | "system";
  timestamp?: string;
  buttons?: ChatBubbleButton[]; // optional action buttons
  onButtonPress?: (value?: string) => void; // ← NEW: delegate to hook
};

// App schemes + store fallbacks (used only if onButtonPress isn't passed)
const VENDOR = {
  "uber-eats": {
    app: "ubereats://",
    iosStore: "https://apps.apple.com/app/ubereats-food-delivery/id1058959277",
    androidStore: "market://details?id=com.ubercab.eats",
    androidStoreWeb:
      "https://play.google.com/store/apps/details?id=com.ubercab.eats",
    bg: "#000000",
    fg: "#FFFFFF",
  },
  doordash: {
    app: "doordash://",
    iosStore: "https://apps.apple.com/app/doordash-food-delivery/id719972451",
    androidStore: "market://details?id=com.dd.doordash",
    androidStoreWeb:
      "https://play.google.com/store/apps/details?id=com.dd.doordash",
    bg: "#EB001B",
    fg: "#FFFFFF",
  },
} as const;

async function openVendorApp(key: "uber-eats" | "doordash") {
  const cfg = VENDOR[key];
  try {
    // try native app first
    await Linking.openURL(cfg.app);
    return;
  } catch {}
  // fall back to store
  if (Platform.OS === "ios") {
    await Linking.openURL(cfg.iosStore);
  } else {
    try {
      await Linking.openURL(cfg.androidStore); // Play Store app
    } catch {
      await Linking.openURL(cfg.androidStoreWeb); // web fallback
    }
  }
}

// minimal **bold** renderer (keeps everything else as-is)
function renderWithBold(text: string) {
  const parts = text.split("**");
  return parts.map((chunk, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={{ fontWeight: "700" }}>
        {chunk}
      </Text>
    ) : (
      <Text key={i}>{chunk}</Text>
    )
  );
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  role,
  timestamp,
  buttons,
  onButtonPress,
}) => {
  const isUser = role === "user";
  const author = isUser ? "You" : "Calio";

  return (
    <View style={styles.wrapper}>
      {/* Author label */}
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
          {renderWithBold(content)}
        </Text>

        {/* Action buttons (optional, bot-only) */}
        {!!buttons?.length && !isUser && (
          <View style={styles.btnGroup}>
            {buttons.map((b, idx) => {
              // color by vendor; default to dark button
              const vendor =
                b.value === "doordash"
                  ? VENDOR["doordash"]
                  : b.value === "uber-eats"
                  ? VENDOR["uber-eats"]
                  : null;
              const bg = vendor?.bg ?? "#111";
              const fg = vendor?.fg ?? "#FFF";

              return (
                <TouchableOpacity
                  key={`${b.label}-${idx}`}
                  activeOpacity={0.8}
                  style={[styles.btn, { backgroundColor: bg }]}
                  onPress={async () => {
                    // Prefer delegating to the hook so it can append bubbles,
                    // then deep-link (acknowledgement UX).
                    if (onButtonPress) {
                      onButtonPress(b.value);
                      return;
                    }
                    // Fallback: open directly from the component.
                    if (b.value === "uber-eats")
                      return openVendorApp("uber-eats");
                    if (b.value === "doordash")
                      return openVendorApp("doordash");
                    if (b.url) return Linking.openURL(b.url);
                  }}
                >
                  <Text style={[styles.btnText, { color: fg }]}>{b.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Optional timestamp */}
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

  // Buttons
  btnGroup: {
    marginTop: 10,
    gap: 8,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  // Timestamp
  tsRow: {
    marginTop: 2,
    flexDirection: "row",
  },
  tsBot: { justifyContent: "flex-start" },
  tsUser: { justifyContent: "flex-end" },
  timestamp: { fontSize: 10, color: "#888" },
});
