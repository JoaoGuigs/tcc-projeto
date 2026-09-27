import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  xsrfCookieName: "csrf",
  xsrfHeaderName: "x-csrf-token",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.error;
    if (message) error.userMessage = message;
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location?.pathname || "";
      const isAuthRoute = path === "/" || path === "/login" || path === "/cadastro";
      if (!isAuthRoute && !error.config?.__isRetry) {
        window.location.assign(`/?sessao=expirada&from=${encodeURIComponent(path)}`);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
