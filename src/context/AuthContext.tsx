// // src/context/AuthContext.tsx

// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   ReactNode,
// } from "react";
// import { Alert } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { jwtDecode } from "jwt-decode";
// import { login, signup } from "../services/auth";

// type Payload = {
//   exp: number;
//   email: string;
//   username?: string;
// };

// export interface AuthContextType {
//   email: string | null;
//   username: string | null;
//   token: string | null;
//   loading: boolean;
//   // Now takes (username, email, password)
//   signUp: (username: string, email: string, password: string) => Promise<void>;
//   // Now takes (username, email, password)
//   signIn: (username: string, email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: ReactNode }> = ({
//   children,
// }) => {
//   const [email, setEmail] = useState<string | null>(null);
//   const [username, setUsername] = useState<string | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Schedule auto‑logout when token expires
//   const scheduleExpiry = (jwt: string) => {
//     try {
//       const { exp }: Payload = jwtDecode(jwt);
//       const msRemaining = exp * 1000 - Date.now();

//       const doLogout = () => {
//         Alert.alert(
//           "Session Expired",
//           "Your session has expired. Please log in again.",
//           [{ text: "OK" }]
//         );
//         signOut();
//       };

//       if (msRemaining > 0) {
//         setTimeout(doLogout, msRemaining);
//       } else {
//         doLogout();
//       }
//     } catch {
//       Alert.alert(
//         "Session Expired",
//         "Your session has expired. Please log in again.",
//         [{ text: "OK" }]
//       );
//       signOut();
//     }
//   };

//   // On mount: load + validate any stored token
//   useEffect(() => {
//     (async () => {
//       if (__DEV__) {
//         console.log("⚠️ Clearing auth storage (dev mode)");
//         await AsyncStorage.multiRemove(["email", "token"]);
//       }
//       try {
//         const [storedEmail, storedToken] = await Promise.all([
//           AsyncStorage.getItem("email"),
//           AsyncStorage.getItem("token"),
//         ]);
//         if (storedToken) {
//           const { exp, username: u }: Payload = jwtDecode(storedToken);
//           if (exp * 1000 > Date.now()) {
//             setEmail(storedEmail);
//             setUsername(u ?? null);
//             setToken(storedToken);
//             scheduleExpiry(storedToken);
//           } else {
//             await AsyncStorage.multiRemove(["email", "token"]);
//           }
//         }
//       } catch (err) {
//         console.warn("Auth load failed:", err);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   // helper to persist credentials
//   const persist = async (
//     newUsername: string,
//     newEmail: string,
//     newToken: string
//   ) => {
//     await AsyncStorage.multiSet([
//       ["email", newEmail],
//       ["token", newToken],
//     ]);
//     setUsername(newUsername);
//     setEmail(newEmail);
//     setToken(newToken);
//     scheduleExpiry(newToken);
//   };

//   // signUp now called with three args
//   const signUp = async (
//     newUsername: string,
//     newEmail: string,
//     newPassword: string
//   ) => {
//     const { token: jwt } = await signup(newUsername, newEmail, newPassword);
//     await persist(newUsername, newEmail, jwt);
//   };

//   // signIn now called with three args
//   const signIn = async (
//     userUsername: string,
//     userEmail: string,
//     userPassword: string
//   ) => {
//     const { token: jwt } = await login(userUsername, userEmail, userPassword);
//     await persist(userUsername, userEmail, jwt);
//   };

//   const signOut = async () => {
//     await AsyncStorage.multiRemove(["email", "token"]);
//     setUsername(null);
//     setEmail(null);
//     setToken(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         email,
//         username,
//         token,
//         loading,
//         signUp,
//         signIn,
//         signOut,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = (): AuthContextType => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
//   return ctx;
// };

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
import Constants from "expo-constants";

const { extra } = Constants.manifest2 ?? Constants.expoConfig ?? {};
const API_BASE = extra?.API_BASE ?? "http://192.168.3.190:3001/api";

type TokenPayload = {
  exp: number;
  email: string;
  "cognito:username": string;
  preferred_username?: string;
};

export interface AuthContextType {
  email: string | null;
  username: string | null;
  token: string | null;
  loading: boolean;
  signUp(email: string, username: string, password: string): Promise<void>;
  confirmSignUp(email: string, code: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /** Decode a JWT, schedule auto-logout at expiry */
  const scheduleExpiry = (jwt: string) => {
    let payload: TokenPayload;
    try {
      payload = jwtDecode<TokenPayload>(jwt);
    } catch {
      return;
    }
    const msLeft = payload.exp * 1000 - Date.now();
    const doLogout = () => {
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please log in again.",
        [{ text: "OK", onPress: signOut }]
      );
    };
    if (msLeft > 0) {
      setTimeout(doLogout, msLeft);
    } else {
      doLogout();
    }
  };

  /** On mount: restore token from storage (if still valid) */
  useEffect(() => {
    (async () => {
      if (__DEV__) {
        console.log(" Clearning auth storage (dev) ");
        await AsyncStorage.clear();
      }
      try {
        const stored = await AsyncStorage.getItem("token");
        if (stored) {
          const {
            exp,
            email,
            preferred_username,
            "cognito:username": sub,
          } = jwtDecode<TokenPayload>(stored);
          if (exp * 1000 > Date.now()) {
            setToken(stored);
            setEmail(email);
            setUsername(preferred_username ?? sub);
            scheduleExpiry(stored);
          } else {
            await AsyncStorage.removeItem("token");
          }
        }
      } catch (e) {
        console.warn("Auth load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Persist a fresh ID token & pull out user info */
  const persistToken = async (jwt: string) => {
    await AsyncStorage.setItem("token", jwt);
    const {
      email,
      preferred_username,
      "cognito:username": sub,
    } = jwtDecode<TokenPayload>(jwt);
    setEmail(email);
    setUsername(preferred_username ?? sub);
    setToken(jwt);
    scheduleExpiry(jwt);
  };

  /** 1) Kick off sign-up, Cognito will email OTP */
  const signUp = async (
    userEmail: string,
    userName: string,
    password: string
  ) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, username: userName, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Sign up failed");
    }
    // on success the server returns { message: ... }
  };

  /** 2) Confirm the OTP code */
  const confirmSignUp = async (userEmail: string, code: string) => {
    const res = await fetch(`${API_BASE}/auth/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, code }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Confirmation failed");
    }
  };

  /** 3) Finalize login and store token */
  const signIn = async (userEmail: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Login failed");
    }
    const { idToken } = (await res.json()) as {
      accessToken: string;
      idToken: string;
      refreshToken: string;
    };
    await persistToken(idToken);
  };

  /** Clear everything */
  const signOut = async () => {
    await AsyncStorage.removeItem("token");
    setToken(null);
    setEmail(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{
        email,
        username,
        token,
        loading,
        signUp,
        confirmSignUp,
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
