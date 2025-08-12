import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  onPress,
  style,
  textStyle,
  icon,
}) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {icon && <View style={styles.iconContainer}>{icon}</View>}
    <Text style={[styles.text, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 50,
    paddingVertical: 14,
    marginVertical: 8,
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  text: {
    color: colors.onPrimary,
    fontSize: typography.button,
    fontWeight: "600",
  },
});

export default AuthButton;
