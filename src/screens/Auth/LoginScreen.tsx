import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Keyboard,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { useAuth } from "../../context/AuthContext";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import typography from "../../theme/typography";

// ───────────────────────────────────────────────────────────────────────────────
// Types
type LoginScreenProps = { onClose: () => void };

// Constants
const HEADER_HEIGHT = 56;
const TOP_MARGIN = 12; // keep a small gap from status bar when fully lifted
const { height: SCREEN_H } = Dimensions.get("window");

// ───────────────────────────────────────────────────────────────────────────────
const LoginScreen: React.FC<LoginScreenProps> = ({ onClose }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, "SignIn">>();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = identifier.trim() && password.length > 0;

  // Animated translate for the whole sheet
  const translateY = useRef(new Animated.Value(0)).current;

  // We'll clamp movement so the sheet never crosses the top
  const sheetTopY = useRef<number | null>(null);

  // Measure the top Y of the sheet (relative to screen)
  const onSheetLayout = (e: any) => {
    // Top Y of the sheet at rest (when translateY=0)
    const y = e.nativeEvent.layout.y;
    // Only set once; we want the baseline at its resting position
    if (sheetTopY.current == null) sheetTopY.current = y;
  };

  // Keyboard listeners → animate the entire sheet
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const kbH = e?.endCoordinates?.height ?? 0;

      // Desired upward movement so that button sits above the keyboard:
      let desiredUp = kbH;

      // Clamp so header never goes under the status bar
      // maxUp = how much we can go up before the sheet's top would cross TOP_MARGIN
      const baseTop = sheetTopY.current ?? SCREEN_H * 0.55; // fallback
      const maxUp = Math.max(0, baseTop - TOP_MARGIN);
      const finalUp = Math.min(desiredUp, maxUp);

      Animated.timing(translateY, {
        toValue: -finalUp,
        duration: Platform.OS === "ios" ? 220 : 0,
        useNativeDriver: true,
      }).start();
    };

    const onHide = () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: Platform.OS === "ios" ? 200 : 0,
        useNativeDriver: true,
      }).start();
    };

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);

    // iOS: handle frame changes (rotation, QuickType bar, etc.)
    let s3: any;
    if (Platform.OS === "ios") {
      s3 = Keyboard.addListener("keyboardWillChangeFrame", (e: any) => {
        const kbH = Math.max(
          0,
          SCREEN_H - (e?.endCoordinates?.screenY ?? SCREEN_H)
        );
        const baseTop = sheetTopY.current ?? SCREEN_H * 0.55;
        const maxUp = Math.max(0, baseTop - TOP_MARGIN);
        const finalUp = Math.min(kbH, maxUp);
        Animated.timing(translateY, {
          toValue: -finalUp,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    }

    return () => {
      s1.remove();
      s2.remove();
      if (s3) s3.remove();
    };
  }, [translateY]);

  // Submit
  const handleLogin = async () => {
    if (!canSubmit) return;
    try {
      await signIn(identifier, password);
      onClose();
    } catch (err: any) {
      Alert.alert("Login failed", err?.message || "An error occurred");
    }
  };

  return (
    // NOTE: This SafeAreaView only gives the sheet its rounded container & colors.
    // The sheet itself is translated; we do NOT rely on KeyboardAvoidingView here.
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Animated bottom sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        onLayout={onSheetLayout}
      >
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
          keyboardDismissMode="interactive"
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
            autoCapitalize="none"
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
              autoCapitalize="none"
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
            onPress={handleLogin}
          >
            <Text style={styles.submitText}>Log in</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// ───────────────────────────────────────────────────────────────────────────────
// Styles
const styles = StyleSheet.create({
  // Full-screen dim/host given by your modal parent. This sheet just draws itself.
  container: {
    backgroundColor: "transparent",
    flex: 1,
  },

  // Bottom sheet container
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0, // pinned to bottom at rest
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },

  header: {
    height: HEADER_HEIGHT,
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
    paddingBottom: spacing.xl, // base space; keyboard shift handles the rest
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
    height: "100%",
    justifyContent: "center",
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
