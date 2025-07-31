import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";

const LogoHeader: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>calio</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  text: {
    color: colors.onBackground,
    fontSize: typography.xxxl,
    fontWeight: "bold",
  },
});

export default LogoHeader;
