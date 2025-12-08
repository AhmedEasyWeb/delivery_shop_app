import { Capacitor } from "@capacitor/core";
import { CapacitorHttp } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import baseUrl from "./baseUrl";

interface HttpRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  data?: any;
}

export async function httpRequest<T>(options: HttpRequestOptions): Promise<T> {
  const token = (await Preferences.get({ key: "sessionToken" })).value;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (Capacitor.getPlatform() === "web") {
    return fetchWebRequest<T>({ ...options, headers });
  }

  if (Capacitor.getPlatform() === "android") {
    return fetchAndroidRequest<T>({ ...options, headers });
  }

  throw new Error("Unsupported platform");
}

async function fetchAndroidRequest<T>(options: HttpRequestOptions) {
  const { url, method = "GET", headers, data } = options;

  const response = await CapacitorHttp.request({
    method,
    url: baseUrl + url,
    headers,
    data,
  });

  return response.data as T;
}

async function fetchWebRequest<T>(options: HttpRequestOptions): Promise<T> {
  const { url, method = "GET", headers, data } = options;

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  if (data && (method === "POST" || method === "PUT")) {
    fetchOptions.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  const response = await fetch(baseUrl + url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Request failed");
  }

  return (await response.json()) as T;
}
