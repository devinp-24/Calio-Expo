// // src/services/auth.ts
// export const BASE_URL = "http://192.168.1.81:4000";

// type TokenResponse = { token: string };

// export async function signup(
//   username: string,
//   email: string,
//   password: string
// ): Promise<TokenResponse> {
//   const res = await fetch(`${BASE_URL}/signup`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, email, password }),
//   });
//   if (!res.ok) {
//     const { error } = await res.json();
//     throw new Error(error || "Signup failed");
//   }
//   return res.json();
// }

// export async function login(
//   username: string,
//   email: string,
//   password: string
// ): Promise<TokenResponse> {
//   const res = await fetch(`${BASE_URL}/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, email, password }),
//   });
//   if (!res.ok) {
//     const { error } = await res.json();
//     throw new Error(error || "Login failed");
//   }
//   return res.json();
// }

// src/services/auth.ts
import Constants from "expo-constants";

const { extra } = Constants.manifest2 ?? Constants.expoConfig ?? {};

const BASE: string = extra?.API_BASE ?? "http://192.168.1.81:3001";

type Json = { message?: string; error?: string };

export async function signup(
  username: string,
  email: string,
  password: string
): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const body: Json = await res.json();
  if (!res.ok) {
    throw new Error(body.error || body.message || "Signup failed");
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body: Json & { token?: string } = await res.json();
  if (!res.ok || !body.token) {
    throw new Error(body.error || body.message || "Login failed");
  }
  return { token: body.token };
}

export async function confirmSignup(
  email: string,
  code: string
): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const body: Json = await res.json();
  if (!res.ok) {
    throw new Error(body.error || body.message || "Confirmation failed");
  }
}
