/** Base URL of the FastAPI backend, injected at build time via EXPO_PUBLIC_API_URL. */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000").replace(/\/$/, "");

/** ws:// or wss:// origin derived from the API base URL. */
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");
