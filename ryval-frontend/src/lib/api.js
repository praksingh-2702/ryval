import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach the JWT to every request if we have one stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ryval_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever returns 401 (expired/invalid token), clear it so the
// UI falls back to a logged-out state instead of silently failing forever.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ryval_token");
      localStorage.removeItem("ryval_user");
    }
    return Promise.reject(error);
  }
);

export default api;
