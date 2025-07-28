// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootParamList } from "../navigation/types";
import { login, signup } from "../services/auth";

type Payload = { exp: number; email: string };

export type AuthContextType = {
  email: string | null;
  token: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const nav = useNavigation<NativeStackNavigationProp<RootParamList>>();

  // Helper: schedule an automatic sign-out at token expiry
  const scheduleExpiry = (tok: string) => {
    try {
      const { exp }: Payload = jwtDecode(tok);
      const msUntilExpiry = exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) {
        // already expired
        signOut();
      } else {
        setTimeout(() => {
          Alert.alert(
            "Session expired",
            "Please log in again.",
            [{ text: "OK", onPress: () => {} }],
            { cancelable: false }
          );
          signOut();
        }, msUntilExpiry);
      }
    } catch {
      // invalid token, force logout
      signOut();
    }
  };

  // On mount: load stored values and redirect appropriately
  useEffect(() => {
    (async () => {
      const storedEmail = await AsyncStorage.getItem("email");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedToken) {
        try {
          const { exp }: Payload = jwtDecode(storedToken);
          if (exp * 1000 > Date.now()) {
            // Token still valid → restore state but DO NOT auto‐navigate
            setEmail(storedEmail);
            setToken(storedToken);
            scheduleExpiry(storedToken);
            return;
          }
        } catch {
          // invalid token
        }
        // Token expired or invalid → clear
        await AsyncStorage.removeItem("token");
        setToken(null);
        // (we stay on SignIn by default)
        return;
      }

      // No token → stay on SignIn, but pre-fill email
      if (storedEmail) {
        setEmail(storedEmail);
      }
    })();
  }, []);

  // Persist credentials, navigate to Home, and schedule expiry
  const persist = async (newEmail: string, newToken: string) => {
    await AsyncStorage.setItem("email", newEmail);
    await AsyncStorage.setItem("token", newToken);
    setEmail(newEmail);
    setToken(newToken);
    nav.reset({ index: 0, routes: [{ name: "Home" }] });
    scheduleExpiry(newToken);
  };

  // Sign-up flow
  const signUp = async (e: string, p: string) => {
    const { token: newToken } = await signup(e, p);
    await persist(e, newToken);
  };

  // Sign-in flow
  const signIn = async (e: string, p: string) => {
    const { token: newToken } = await login(e, p);
    await persist(e, newToken);
  };

  // Sign-out flow
  const signOut = async () => {
    await AsyncStorage.multiRemove(["email", "token"]);
    setEmail(null);
    setToken(null);
    nav.reset({ index: 0, routes: [{ name: "SignIn" }] });
  };

  return (
    <AuthContext.Provider value={{ email, token, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be inside AuthProvider");
  }
  return ctx;
};
