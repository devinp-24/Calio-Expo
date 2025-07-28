// src/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignInScreen from "../screens/Auth/SignInScreen";
import SignUpScreen from "../screens/Auth/SignUpScreen";
import HomeScreen from "../screens/HomeScreen";
import Chatbot from "../screens/Chatbot";
import type { RootParamList } from "./types";

const Stack = createNativeStackNavigator<RootParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      // hide header for *all* screens in this stack
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Home" component={Chatbot} />
    </Stack.Navigator>
  );
}
