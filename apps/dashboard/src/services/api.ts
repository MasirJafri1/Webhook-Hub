import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8790/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("whpk_api_key");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const projectId = localStorage.getItem("whpk_project_id");
  if (projectId) {
    config.headers["X-Project-Id"] = projectId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthUrl = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/signup");
    if (error.response?.status === 401 && !isAuthUrl) {
      localStorage.removeItem("whpk_api_key");
      localStorage.removeItem("whpk_user_role");
      localStorage.removeItem("whpk_user_email");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

