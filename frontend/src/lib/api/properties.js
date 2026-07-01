// frontend/src/lib/api/properties.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const propertyApi = {
  // GET all properties with search/filter/pagination
  getAll: async (params = {}, token) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && v !== null) query.set(k, v);
    });
    const res = await fetch(`${API_URL}/api/properties?${query.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to fetch properties");
    return json;
  },

  // GET single property
  getById: async (id, token) => {
    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Property not found");
    return json;
  },

  // POST create property (auth required)
  create: async (data, token) => {
    const res = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create property");
    return json;
  },

  // PUT update property (auth + owner required)
  update: async (id, data, token) => {
    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update property");
    return json;
  },

  // DELETE property (auth + owner required)
  delete: async (id, token) => {
    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete property");
    return json;
  },
};
