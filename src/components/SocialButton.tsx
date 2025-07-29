import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";

interface SocialButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  label,
  icon,
  onPress,
  style,
}) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.iconContainer}>{icon}</View>
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  iconContainer: {
    marginHorizontal: spacing.md,
  },
  text: {
    flex: 1,
    textAlign: "center",
    fontSize: typography.button,
    color: colors.onSurface,
  },
});

export default SocialButton;
