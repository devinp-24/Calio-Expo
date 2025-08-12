// src/screens/Auth/SignInScreen.tsx

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  ImageBackground,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, CommonActions } from "@react-navigation/native";

import SignUpScreen from "./SignUpScreen";
import LoginScreen from "./LoginScreen";
import ConfirmSignUpScreen from "./ConfirmSignUpScreen";
import AuthButton from "../../components/AuthButton";

const googleLogo = require("../../assets/images/google.png");
const appleLogo = require("../../assets/images/apple-logo.png");
const logoImage = require("../../assets/images/logo.png");
const images = [
  require("../../assets/images/image.png"),
  require("../../assets/images/image2.png"),
  require("../../assets/images/image3.png"),
];
const bgImage = images[Math.floor(Math.random() * images.length)];

const { height: windowHeight } = Dimensions.get("window");
const IMAGE_HEIGHT = windowHeight * 0.45;

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [pendingPassword, setPendingPassword] = useState<string>("");

  const handleGoogle = () => {
    // your Google auth logic
  };
  const handleApple = () => {
    // your Apple auth logic
  };

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

        <AuthButton
          label="Continue with Apple"
          onPress={handleApple}
          icon={<Image source={appleLogo} style={styles.iconImage} />}
          style={styles.appleButton}
          textStyle={styles.appleText}
        />

        <AuthButton
          label="Continue with Google"
          onPress={handleGoogle}
          icon={<Image source={googleLogo} style={styles.iconImage} />}
          style={styles.googleButton}
          textStyle={styles.googleText}
        />

        <AuthButton
          label="Sign up"
          onPress={() => setShowSignUp(true)}
          style={styles.signUpButton}
          textStyle={styles.signUpText}
        />

        <AuthButton
          label="Log in"
          onPress={() => setShowLogin(true)}
          style={styles.loginButton}
          textStyle={styles.loginText}
        />
      </View>

      {/* —— Slide-up SignUp modal —— */}
      <Modal
        visible={showSignUp}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSignUp(false)}
      >
        <View style={modalStyles.backdrop} />
        <View style={modalStyles.sheet}>
          <SignUpScreen
            onClose={() => setShowSignUp(false)}
            onSuccess={(email: string, password: string) => {
              setPendingEmail(email);
              setPendingPassword(password);
              setShowSignUp(false);
              setShowConfirm(true);
            }}
          />
        </View>
      </Modal>

      {/* —— Slide-up LogIn modal —— */}
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

      {/* —— Confirm OTP Modal —— */}
      <Modal
        visible={showConfirm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={modalStyles.backdrop} />
        <View style={modalStyles.sheet}>
          <ConfirmSignUpScreen
            email={pendingEmail}
            password={pendingPassword}
            onClose={() => setShowConfirm(false)}
            onSuccess={() => {
              setShowConfirm(false);
            }}
          />
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
  iconImage: { width: 18, height: 18 },

  googleButton: { backgroundColor: "#FFF" },
  googleText: { color: "#000" },

  appleButton: { backgroundColor: "#FFF" },
  appleText: { color: "#000" },

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
