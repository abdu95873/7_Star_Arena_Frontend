import axios from 'axios';
import { warmupServer, isLikelyColdStartError } from './serverWarmup.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const isProd = import.meta.env.PROD;

// Single axios instance. `withCredentials` is required so the httpOnly
// refresh-token cookie is sent on /auth/refresh.
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: isProd ? 90000 : 20000,
});

let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh-on-401 with a single-flight queue so concurrent 401s share one refresh.
let refreshPromise = null;
const refreshHandlers = { onRefreshed: null, onRefreshFailed: null };
export const registerAuthHandlers = (handlers) => Object.assign(refreshHandlers, handlers);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    if (!original?._coldRetry && isLikelyColdStartError(error) && isProd) {
      original._coldRetry = true;
      const awake = await warmupServer({ attempts: 2 });
      if (awake) return api(original);
    }

    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/register');

    if (status === 401 && !original?._retry && !isAuthRoute) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api
            .post('/auth/refresh')
            .then((r) => r.data?.data?.accessToken)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          setAccessToken(newToken);
          refreshHandlers.onRefreshed?.(newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (e) {
        refreshHandlers.onRefreshFailed?.();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { warmupServer };
