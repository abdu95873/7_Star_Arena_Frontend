import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Single axios instance. `withCredentials` is required so the httpOnly
// refresh-token cookie is sent on /auth/refresh.
const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 20000,
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
