// frontend/src/lib/api/auth.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const authApi = {
  register: async (data) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Registration failed");
    return json;
  },

  login: async (data) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Login failed");
    return json;
  },

  logout: async (token) => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
  },

  refresh: async () => {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error("Session expired");
    return json;
  },

  getMe: async (token) => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error("Unauthorized");
    return json;
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Request failed");
    return json;
  },

  resetPassword: async ({ email, token, password }) => {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Reset failed");
    return json;
  },
};
