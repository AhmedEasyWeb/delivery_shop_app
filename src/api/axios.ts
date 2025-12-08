import { getLocalData } from "@/utils/localStorage";
import axios from "axios";

export const baseUrl = "https://deliveryshop.cloud/api";
// export const baseUrl = "http://localhost:8080/api";

const api = axios.create({
  baseURL: baseUrl,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const sessionToken = await getLocalData("sessionToken");
      if (sessionToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${sessionToken}`;
      }
    } catch (err) {
      console.warn("Failed to load sessionToken from Preferences:", err);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default api;
