// frontend/src/lib/api/inquiries.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const inquiryApi = {
  create: async ({ propertyId, message }, token) => {
    const res = await fetch(`${API_URL}/api/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ propertyId, message }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to send inquiry");
    return json;
  },

  getSent: async (token) => {
    const res = await fetch(`${API_URL}/api/inquiries/sent`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to fetch inquiries");
    return json;
  },

  getReceived: async (token) => {
    const res = await fetch(`${API_URL}/api/inquiries/received`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to fetch inquiries");
    return json;
  },
};
