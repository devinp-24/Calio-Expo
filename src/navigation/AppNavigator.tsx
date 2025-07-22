import React from "react";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainTabNavigator from "./MainTabNavigator";

export default function AppNavigator() {
  const { token } = useAuth();
  return token == null ? <AuthNavigator /> : <MainTabNavigator />;
}
