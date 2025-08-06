// src/screens/Auth/ConfirmSignUpScreen.tsx

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { confirmSignup } from "../../services/auth";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import typography from "../../theme/typography";

type ConfirmSignUpProps = {
  email: string; // email just registered
  onClose: () => void; // cancel
  onSuccess: () => void; // OTP OK → go to chat
};

const ConfirmSignUpScreen: React.FC<ConfirmSignUpProps> = ({
  email,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!code.trim()) {
      return Alert.alert(
        "Code required",
        "Please enter the 6-digit confirmation code."
      );
    }
    setLoading(true);
    try {
      await confirmSignup(email, code.trim());
      // OTP is valid → fire onSuccess
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        "Confirmation failed",
        err.message || "Please double-check your code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Confirm Your Account</Text>
        <Text style={styles.subtitle}>A 6-digit code was sent to:</Text>
        <Text style={styles.email}>{email}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter confirmation code"
          placeholderTextColor={colors.onSurface + "66"}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!code.trim() || loading) && styles.buttonDisabled,
          ]}
          disabled={!code.trim() || loading}
          onPress={handleConfirm}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancel} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.md,
  },
  inner: { width: "100%" },
  title: {
    fontSize: typography.xl,
    fontWeight: "600",
    color: colors.onBackground,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.md,
    color: colors.onBackground,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.md,
    color: colors.accent,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.onSurface + "66",
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: typography.lg,
    color: colors.onBackground,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.onSurface + "33",
  },
  buttonText: {
    color: "#FFF",
    fontSize: typography.button,
    fontWeight: "600",
  },
  cancel: {
    alignItems: "center",
    marginTop: spacing.xs,
  },
  cancelText: {
    color: colors.onSurface,
    fontSize: typography.md,
  },
});

export default ConfirmSignUpScreen;
