import React, { createContext, useContext, useState, ReactNode } from "react";

export interface AuthContextType {
  token: string | null;
  signIn: (token: string) => void;
  signUp: (token: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);

  const signIn = (tok: string) => {
    setToken(tok);
  };
  const signUp = (tok: string) => {
    setToken(tok);
  };
  const signOut = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
