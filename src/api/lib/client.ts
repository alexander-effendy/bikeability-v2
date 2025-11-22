// src/lib/api/client.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3003";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // for cookies (impotrtant)
});

apiClient.interceptors.request.use(
  (config) => {
    // no Authorization header needed lah auth is via HttpOnly cookies
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error);
    return Promise.reject(error);
  }
);

/**
 * 
 * 
 */