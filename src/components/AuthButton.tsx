import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}

const AuthButton: React.FC<AuthButtonProps> = ({ label, onPress, style }) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  text: {
    color: colors.onPrimary,
    fontSize: typography.button,
    fontWeight: '600',
  },
});

export default AuthButton;
