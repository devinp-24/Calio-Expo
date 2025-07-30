// // src/navigation/AppNavigator.tsx
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import SignInScreen from "../screens/Auth/SignInScreen";
// import SignUpScreen from "../screens/Auth/SignUpScreen";
// import HomeScreen from "../screens/HomeScreen";
// import Chatbot from "../screens/Chatbot";
// import type { RootParamList } from "./types";

// const Stack = createNativeStackNavigator<RootParamList>();

// export default function AppNavigator() {
//   return (
//     <Stack.Navigator
//       // hide header for *all* screens in this stack
//       screenOptions={{ headerShown: false }}
//     >
//       <Stack.Screen name="SignIn" component={SignInScreen} />
//       <Stack.Screen name="Home" component={Chatbot} />
//     </Stack.Navigator>
//   );
// }
import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainTabNavigator from "./MainTabNavigator";

export default function AppNavigator() {
  const { token, loading } = useAuth();
  console.log("loading: " + loading);

  // 1) Still validating token? Show a spinner.
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2) Once loading=false, pick the correct navigator
  return token == null ? <AuthNavigator /> : <MainTabNavigator />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
