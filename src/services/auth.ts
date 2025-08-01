// src/services/auth.ts
export const BASE_URL = "http://192.168.0.103:4000";

type TokenResponse = { token: string };

export async function signup(
  username: string,
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Signup failed");
  }
  return res.json();
}

export async function login(
  username: string,
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Login failed");
  }
  return res.json();
}
