// src/screens/Auth/SignInScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ImageBackground,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SignUpScreen from "./SignUpScreen";
import LoginScreen from "./LoginScreen";

const googleLogo = require("../../assets/images/google.png");
const logoImage = require("../../assets/images/logo.png");
const images = [
  require("../../assets/images/image.png"),
  require("../../assets/images/image2.png"),
  require("../../assets/images/image3.png"),
];
const ch = Math.floor(Math.random() * images.length);
const bgImage = images[ch];

const { height: windowHeight } = Dimensions.get("window");
const IMAGE_HEIGHT = windowHeight * 0.5;

const SignInScreen: React.FC = () => {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleGoogle = () => {
    /* your Google auth logic */
  };
  const handleSignUp = () => setShowSignUp(true);
  const handleLogin = () => setShowLogin(true);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ImageBackground
        source={bgImage}
        style={[styles.image, { height: IMAGE_HEIGHT }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "#000"]}
          style={styles.gradient}
        />
      </ImageBackground>

      <View style={styles.content}>
        <Image source={logoImage} style={styles.logo} />

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogle}
        >
          <Image source={googleLogo} style={styles.iconImage} />
          <Text style={[styles.buttonText, styles.googleText]}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signUpButton]}
          onPress={handleSignUp}
        >
          <Text style={[styles.buttonText, styles.signUpText]}>Sign up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleLogin}
        >
          <Text style={[styles.buttonText, styles.loginText]}>Log in</Text>
        </TouchableOpacity>
      </View>

      {/* —— Slide‑up SignUp modal —— */}
      <Modal
        visible={showSignUp}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSignUp(false)}
      >
        <View style={modalStyles.backdrop} />
        <View style={modalStyles.sheet}>
          <SignUpScreen onClose={() => setShowSignUp(false)} />
        </View>
      </Modal>

      {/* —— Slide‑up LogIn modal —— */}
      <Modal
        visible={showLogin}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogin(false)}
      >
        <View style={modalStyles.backdrop} />
        <View style={modalStyles.sheet}>
          <LoginScreen onClose={() => setShowLogin(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  image: { width: "100%" },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: -40,
  },
  logo: {
    width: 160,
    height: 83,
    resizeMode: "contain",
    marginBottom: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderRadius: 50,
    paddingVertical: 14,
    marginVertical: 8,
    justifyContent: "center",
  },
  iconImage: { width: 18, height: 18, marginRight: 12 },
  buttonText: { fontSize: 16, fontWeight: "600" },

  googleButton: { backgroundColor: "#444" },
  googleText: { color: "#FFF" },

  signUpButton: { backgroundColor: "#444" },
  signUpText: { color: "#FFF" },

  loginButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  loginText: { color: "#FFF" },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

export default SignInScreen;
