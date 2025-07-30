// src/screens/Auth/SignUpScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import typography from "../../theme/typography";

type SignUpProps = {
  /** Called when the user taps the close (“×”) button */
  onClose: () => void;
};

const SignUpScreen: React.FC<SignUpProps> = ({ onClose }) => {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Validation
  const isPasswordValid = password.length >= 8;
  const isMatch = password === confirm;
  const allRequiredFilled =
    fullName.trim() &&
    username.trim() &&
    email.trim() &&
    isPasswordValid &&
    isMatch;

  const handleSignUp = async () => {
    if (!allRequiredFilled || loading) return;
    setLoading(true);
    try {
      // only email & password are needed for our mock API
      await signUp(username, email, password);

      // on success, AuthContext will navigate to Home
    } catch (err: any) {
      Alert.alert("Sign up failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sign Up</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* FORM */}
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, focused === "fullName" && styles.inputFocused]}
          placeholder="Your name"
          placeholderTextColor={colors.onSurface + "88"}
          value={fullName}
          onChangeText={setFullName}
          onFocus={() => setFocused("fullName")}
          onBlur={() => setFocused(null)}
        />

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, focused === "username" && styles.inputFocused]}
          placeholder="choose a username"
          placeholderTextColor={colors.onSurface + "88"}
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFocused("username")}
          onBlur={() => setFocused(null)}
        />

        {/* Display Name */}
        <Text style={styles.label}>
          Display Name <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            focused === "displayName" && styles.inputFocused,
          ]}
          placeholder="How others see you"
          placeholderTextColor={colors.onSurface + "88"}
          value={displayName}
          onChangeText={setDisplayName}
          onFocus={() => setFocused("displayName")}
          onBlur={() => setFocused(null)}
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, focused === "email" && styles.inputFocused]}
          placeholder="you@example.com"
          placeholderTextColor={colors.onSurface + "88"}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          onFocus={() => setFocused("email")}
          onBlur={() => setFocused(null)}
        />

        {/* Create password */}
        <Text style={styles.label}>Create new password</Text>
        <TextInput
          style={[styles.input, focused === "password" && styles.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor={colors.onSurface + "88"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocused("password")}
          onBlur={() => setFocused(null)}
        />
        {!isPasswordValid && (
          <Text style={styles.error}>
            Password must be at least 8 characters long
          </Text>
        )}

        {/* Re‑enter password */}
        <Text style={styles.label}>Re‑enter new password</Text>
        <TextInput
          style={[styles.input, focused === "confirm" && styles.inputFocused]}
          placeholder="••••••••"
          placeholderTextColor={colors.onSurface + "88"}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          onFocus={() => setFocused("confirm")}
          onBlur={() => setFocused(null)}
        />
        {!isMatch && <Text style={styles.error}>Passwords must match</Text>}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submit,
            (!allRequiredFilled || loading) && styles.submitDisabled,
          ]}
          disabled={!allRequiredFilled || loading}
          onPress={handleSignUp}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Sign up</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  close: {
    color: colors.onBackground,
    fontSize: 24,
  },
  title: {
    color: colors.onBackground,
    fontSize: typography.lg,
    fontWeight: "600",
  },
  form: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    color: colors.onBackground,
    fontSize: typography.sm,
    marginTop: spacing.md,
  },
  optional: {
    color: colors.onSurface + "88",
    fontSize: typography.xs,
  },
  input: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.onSurface + "66",
    borderRadius: 8,
    color: colors.onBackground,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  error: {
    color: colors.accent,
    fontSize: typography.xs,
    marginTop: spacing.xs,
  },
  submit: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: 50,
    alignItems: "center",
  },
  submitDisabled: {
    backgroundColor: colors.onSurface + "66",
  },
  submitText: {
    color: "#FFF",
    fontSize: typography.button,
    fontWeight: "600",
  },
});

export default SignUpScreen;
