// src/screens/Auth/LoginScreen.tsx
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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useAuth } from "../../context/AuthContext"; // ← import useAuth
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import typography from "../../theme/typography";

// 1️⃣ Declare the onClose prop
type LoginScreenProps = {
  onClose: () => void;
};
const LoginScreen: React.FC<LoginScreenProps> = ({ onClose }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, "SignIn">>();
  const { signIn } = useAuth(); // ← get signIn from context
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = identifier.trim() && password.length > 0;

  // ← add handleLogin logic
  const handleLogin = async () => {
    if (!canSubmit) return;
    try {
      await signIn(identifier);
      // navigation to Home is handled by AuthContext
    } catch (err: any) {
      Alert.alert("Login failed", err.message || "An error occurred");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log in</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form */}
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        {/* Username or Email */}
        <Text style={styles.label}>Username or email</Text>
        <TextInput
          style={[styles.input, focusedField === "id" && styles.inputFocused]}
          placeholder="you@example.com"
          placeholderTextColor={colors.onSurface + "88"}
          value={identifier}
          onChangeText={setIdentifier}
          onFocus={() => setFocusedField("id")}
          onBlur={() => setFocusedField(null)}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              focusedField === "pwd" && styles.inputFocused,
            ]}
            placeholder="••••••••"
            placeholderTextColor={colors.onSurface + "88"}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField("pwd")}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity
            style={styles.showToggle}
            onPress={() => setShowPassword((v) => !v)}
          >
            <Text style={styles.showText}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          onPress={() => {
            /* your flow */
          }}
        >
          <Text style={styles.forgot}>forgot password?</Text>
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
          disabled={!canSubmit}
          onPress={handleLogin} // ← wire up handleLogin
        >
          <Text style={styles.submitText}>Log in</Text>
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
  inputWrapper: {
    position: "relative",
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
  showToggle: {
    position: "absolute",
    right: spacing.md,
    height: "100%", // full height of wrapper
    justifyContent: "center", // centers its child vertically
  },
  showText: {
    color: colors.accent,
    fontSize: typography.sm,
    fontWeight: "600",
  },
  forgot: {
    marginTop: spacing.sm,
    color: colors.accent,
    fontSize: typography.xs,
  },
  submit: {
    marginTop: spacing.lg,
    backgroundColor: "rgba(244,92,29,1)",
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

export default LoginScreen;
