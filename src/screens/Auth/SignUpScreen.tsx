import React, { useEffect, useRef, useState } from "react";
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
  Keyboard,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { signup } from "../../services/auth";
import colors from "../../theme/colors";
import spacing from "../../theme/spacing";
import typography from "../../theme/typography";

type SignUpProps = {
  onClose: () => void;
  onSuccess: (email: string, password: string) => void;
};

const HEADER_HEIGHT = 56;
const TOP_MARGIN = 12; // tiny gap from status bar when fully lifted
const { height: SCREEN_H } = Dimensions.get("window");

const SignUpScreen: React.FC<SignUpProps> = ({ onClose, onSuccess }) => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPasswordValid = password.length >= 8;
  const isMatch = password === confirm;
  const allFilled =
    fullName.trim() &&
    username.trim() &&
    email.trim() &&
    isPasswordValid &&
    isMatch;

  const translateY = useRef(new Animated.Value(0)).current;
  const sheetTopY = useRef<number | null>(null);

  const onSheetLayout = (e: any) => {
    if (sheetTopY.current == null) {
      sheetTopY.current = e.nativeEvent.layout.y; // baseline top when at rest
    }
  };

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const animateTo = (to: number, duration = 220) =>
      Animated.timing(translateY, {
        toValue: -to,
        duration: Platform.OS === "ios" ? duration : 0,
        useNativeDriver: true,
      }).start();

    const onShow = (e: any) => {
      const kbH = e?.endCoordinates?.height ?? 0;
      const baseTop = sheetTopY.current ?? SCREEN_H * 0.55;
      const maxUp = Math.max(0, baseTop - TOP_MARGIN); // don’t cross status bar
      const finalUp = Math.min(kbH, maxUp);
      animateTo(finalUp, 220);
    };

    const onHide = () => animateTo(0, 200);

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);

    // iOS frame changes (QuickType bar etc.)
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
        animateTo(finalUp, 180);
      });
    }

    return () => {
      s1.remove();
      s2.remove();
      if (s3) s3.remove();
    };
  }, [translateY]);

  const handleSignUp = async () => {
    if (!allFilled || loading) return;
    setLoading(true);
    try {
      await signup(username, email, password);
      onSuccess(email, password);
    } catch (err: any) {
      Alert.alert("Sign up failed", err.message || "Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.host}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Animated bottom sheet pinned to bottom */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        onLayout={onSheetLayout}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Sign Up</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form (still scrollable for small screens) */}
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              focused === "fullName" && styles.inputFocused,
            ]}
            placeholder="Your name"
            placeholderTextColor={colors.onSurface + "88"}
            value={fullName}
            onChangeText={setFullName}
            onFocus={() => setFocused("fullName")}
            onBlur={() => setFocused(null)}
          />

          {/* Username + Display Name in one row to shorten the form */}
          <View style={styles.row}>
            <View style={[styles.halfField, { marginRight: spacing.sm }]}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  focused === "username" && styles.inputFocused,
                ]}
                placeholder="Username"
                placeholderTextColor={colors.onSurface + "88"}
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocused("username")}
                onBlur={() => setFocused(null)}
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>
                Display Name <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  focused === "displayName" && styles.inputFocused,
                ]}
                placeholder="Enter Display Name"
                placeholderTextColor={colors.onSurface + "88"}
                value={displayName}
                onChangeText={setDisplayName}
                onFocus={() => setFocused("displayName")}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

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

          {/* Password */}
          <Text style={styles.label}>Create new password</Text>
          <TextInput
            style={[
              styles.input,
              focused === "password" && styles.inputFocused,
            ]}
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
              Password must be at least 8 characters
            </Text>
          )}

          {/* Confirm Password */}
          <Text style={styles.label}>Re-enter new password</Text>
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
              (!allFilled || loading) && styles.submitDisabled,
            ]}
            disabled={!allFilled || loading}
            onPress={handleSignUp}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Sign up</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  host: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0, // pinned at bottom at rest (so default position is preserved)
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
  close: { color: colors.onBackground, fontSize: 24 },
  title: {
    color: colors.onBackground,
    fontSize: typography.lg,
    fontWeight: "600",
  },

  form: {
    padding: spacing.md,
    paddingBottom: spacing.xl, // base; lift handled by translateY
  },
  label: {
    color: colors.onBackground,
    fontSize: typography.sm,
    marginTop: spacing.xs + 2,
  },
  optional: { color: colors.onSurface + "88", fontSize: typography.xs },
  input: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.onSurface + "66",
    borderRadius: 8,
    color: colors.onBackground,
  },
  inputFocused: { borderColor: colors.accent },
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
  submitDisabled: { backgroundColor: colors.onSurface + "66" },
  submitText: { color: "#FFF", fontSize: typography.button, fontWeight: "600" },

  row: { flexDirection: "row", marginTop: spacing.md },
  halfField: { flex: 1 },
});

export default SignUpScreen;
