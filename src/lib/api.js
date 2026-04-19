  import axios from "axios";

  // const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const API_BASE = `https://app.agereboot.life/api`;
 
  // API with token + JSON content type
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
    },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("agereboot_token");

    config.headers["Content-Type"] = "application/json";

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  let isRedirecting = false;

  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && !isRedirecting) {
        const detail = err.response?.data?.detail || "";

        // Only logout on genuine auth failures, not transient errors
        if (
          detail === "Token expired" ||
          detail === "Invalid token" ||
          detail === "Missing or invalid token" ||
          detail === "User not found"
        ) {
          isRedirecting = true;
          localStorage.removeItem("agereboot_token");
          localStorage.removeItem("agereboot_user");
          window.location.href = "/login";
        }
      }
      return Promise.reject(err);
    }
  );

  // API without token, only JSON content type
  export const publicApi = axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
    },
  });

  export default api;