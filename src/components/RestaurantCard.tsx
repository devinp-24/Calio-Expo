// components/RestaurantCard.tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  GestureResponderEvent,
} from "react-native";

type Props = {
  name: string;
  rating: number;
  eta: number;
  description: string;
  imageUrl?: string;
  onOrderPress?: (e: GestureResponderEvent) => void;
};

const RestaurantCard: React.FC<Props> = ({
  name,
  rating,
  eta,
  description,
  imageUrl,
  onOrderPress,
}) => (
  <View style={styles.card}>
    <Image
      source={
        imageUrl ? { uri: imageUrl } : require("../../assets/placeholder.png")
      }
      style={styles.thumbnail}
      resizeMode="cover"
    />

    <View style={styles.content}>
      <Text style={styles.name}>{name}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.star}>⭐</Text>
        <Text style={styles.rating}>{rating.toFixed(1)}</Text>
        <Text style={styles.eta}>• {eta} min</Text>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {description}
      </Text>

      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={onOrderPress}
      >
        <Text style={styles.buttonText}>Order Now</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default RestaurantCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 16,
    marginVertical: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    // Android elevation
    elevation: 3,
  },
  thumbnail: {
    width: 100,
    height: 100,
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
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#ff5a1f",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
