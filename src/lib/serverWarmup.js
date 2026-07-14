const API_ROOT = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wake a sleeping Render/free-tier backend before real API calls. */
export async function warmupServer({ attempts = 4, timeoutMs = 90000 } = {}) {
  if (import.meta.env.DEV) return true;

  const urls = [`${API_ROOT}/health`, `${API_ROOT}/api/v1/ping`];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timer);
        if (res.ok) return true;
      } catch {
        /* cold start — retry */
      }
    }
    if (attempt < attempts) await sleep(2500 * attempt);
  }
  return false;
}

export function isLikelyColdStartError(error) {
  if (!error) return false;
  const code = error.code;
  const msg = String(error.message || '').toLowerCase();
  return (
    code === 'ECONNABORTED'
    || code === 'ERR_NETWORK'
    || msg.includes('network error')
    || msg.includes('timeout')
  );
}

/** Ping the backend periodically while the site tab is open (production only). */
export function startKeepAliveInterval({ intervalMs = 12 * 60 * 1000 } = {}) {
  if (import.meta.env.DEV) return () => {};

  const tick = () => {
    if (document.visibilityState === 'visible') {
      warmupServer({ attempts: 1, timeoutMs: 60000 }).catch(() => {});
    }
  };

  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}
