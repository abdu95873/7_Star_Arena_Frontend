import api from './apiClient.js';

export async function submitContactMessage({ name, email, message }) {
  const res = await api.post('/contact', {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
  });
  return res.data;
}

export function contactErrorMessage(err, fallback = 'Could not send message. Please try again or call us.') {
  const status = err?.response?.status;
  const body = err?.response?.data;

  if (status === 404) {
    return 'Server route not found. Restart the backend (npm run dev in server folder) and try again.';
  }
  if (status === 429) {
    return 'Too many messages sent. Please wait a while before trying again.';
  }
  if (status === 400 && Array.isArray(body?.errors) && body.errors.length) {
    return body.errors.map((e) => e.message).join(' ');
  }
  if (body?.message) return body.message;
  if (err?.code === 'ERR_NETWORK' || err?.message?.toLowerCase().includes('network')) {
    return 'Network error. Check your connection and make sure the backend is running.';
  }
  return fallback;
}
