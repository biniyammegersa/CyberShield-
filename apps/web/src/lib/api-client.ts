import axios, { type InternalAxiosRequestConfig } from 'axios';

// Use relative URL so Vite proxies /api → localhost:4000 (avoids CORS hangs)
const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let organizationId: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOrganizationId(orgId: string | null) {
  organizationId = orgId;
}

export function getOrganizationId() {
  return organizationId;
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (organizationId) {
    config.headers['X-Organization-Id'] = organizationId;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!original) {
      return Promise.reject(error);
    }

    // Never retry auth endpoints — prevents refresh 401 loops that block the UI
    if (isAuthEndpoint(original.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post<{ data: { accessToken: string } }>('/auth/refresh')
          .then((r) => {
            const token = r.data.data.accessToken;
            setAccessToken(token);
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      try {
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
