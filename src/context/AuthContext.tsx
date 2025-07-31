// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { login, signup } from "../services/auth";

type Payload = {
  exp: number;
  email: string;
  username?: string;
};

export interface AuthContextType {
  email: string | null;
  username: string | null;
  token: string | null;
  loading: boolean;
  // Now takes (username, email, password)
  signUp: (username: string, email: string, password: string) => Promise<void>;
  // Now takes (username, email, password)
  signIn: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Schedule auto‑logout when token expires
  const scheduleExpiry = (jwt: string) => {
    try {
      const { exp }: Payload = jwtDecode(jwt);
      const msRemaining = exp * 1000 - Date.now();

      const doLogout = () => {
        Alert.alert(
          "Session Expired",
          "Your session has expired. Please log in again.",
          [{ text: "OK" }]
        );
        signOut();
      };

      if (msRemaining > 0) {
        setTimeout(doLogout, msRemaining);
      } else {
        doLogout();
      }
    } catch {
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please log in again.",
        [{ text: "OK" }]
      );
      signOut();
    }
  };

  // On mount: load + validate any stored token
  useEffect(() => {
    (async () => {
      if (__DEV__) {
        console.log("⚠️ Clearing auth storage (dev mode)");
        await AsyncStorage.multiRemove(["email", "token"]);
      }
      try {
        const [storedEmail, storedToken] = await Promise.all([
          AsyncStorage.getItem("email"),
          AsyncStorage.getItem("token"),
        ]);
        if (storedToken) {
          const { exp, username: u }: Payload = jwtDecode(storedToken);
          if (exp * 1000 > Date.now()) {
            setEmail(storedEmail);
            setUsername(u ?? null);
            setToken(storedToken);
            scheduleExpiry(storedToken);
          } else {
            await AsyncStorage.multiRemove(["email", "token"]);
          }
        }
      } catch (err) {
        console.warn("Auth load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // helper to persist credentials
  const persist = async (
    newUsername: string,
    newEmail: string,
    newToken: string
  ) => {
    await AsyncStorage.multiSet([
      ["email", newEmail],
      ["token", newToken],
    ]);
    setUsername(newUsername);
    setEmail(newEmail);
    setToken(newToken);
    scheduleExpiry(newToken);
  };

  // signUp now called with three args
  const signUp = async (
    newUsername: string,
    newEmail: string,
    newPassword: string
  ) => {
    const { token: jwt } = await signup(newUsername, newEmail, newPassword);
    await persist(newUsername, newEmail, jwt);
  };

  // signIn now called with three args
  const signIn = async (
    userUsername: string,
    userEmail: string,
    userPassword: string
  ) => {
    const { token: jwt } = await login(userUsername, userEmail, userPassword);
    await persist(userUsername, userEmail, jwt);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(["email", "token"]);
    setUsername(null);
    setEmail(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        email,
        username,
        token,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
