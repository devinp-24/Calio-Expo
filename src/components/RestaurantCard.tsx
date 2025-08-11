// components/RestaurantCard.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
  Platform,
} from "react-native";

type Props = {
  name: string;
  rating?: number;
  eta: number;
  imageUrl?: string;
  onOrderPress?: (e: GestureResponderEvent) => void;
};

const RestaurantCard: React.FC<Props> = ({
  name,
  rating,
  eta,
  imageUrl,
  onOrderPress,
}) => {
  const safeDisplay = typeof rating === "string" ? rating : "–";

  return (
    <View style={styles.shadowWrap}>
      <View style={styles.card}>
        <Image
          source={
            imageUrl
              ? { uri: imageUrl }
              : require("../../assets/placeholder.png")
          }
          style={styles.thumbnail}
          resizeMode="cover"
        />

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={3}>
            {name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.star}>⭐</Text>
            <Text style={styles.rating}>{safeDisplay}</Text>
            <Text style={styles.eta}>• {eta} min</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={onOrderPress}
          >
            <Text style={styles.buttonText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default RestaurantCard;

const styles = StyleSheet.create({
  shadowWrap: {
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
    width: 270,
    height: 150,
  },
  thumbnail: {
    width: 100,
    // stretch to match the content container height
    height: "100%",
    backgroundColor: "#eee",
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    // allow wrapping
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  star: {
    fontSize: 14,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    color: "#444",
    marginRight: 8,
  },
  eta: {
    fontSize: 14,
    color: "#444",
  },
  button: {
    width: 150,
    backgroundColor: "#ff5a1f",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
