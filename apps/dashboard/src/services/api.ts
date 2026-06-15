import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8790/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("whpk_api_key");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("whpk_api_key");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

