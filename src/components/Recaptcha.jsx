import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Renders a Google reCAPTCHA v2 checkbox when a site key is configured.
// When no key is set (dev), it renders nothing and onToken stays unused —
// the backend bypasses verification when RECAPTCHA_ENABLED=false.
export default function Recaptcha({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return undefined;

    const render = () => {
      if (window.grecaptcha && ref.current && widgetId.current === null) {
        widgetId.current = window.grecaptcha.render(ref.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          callback: (token) => onToken?.(token),
          'expired-callback': () => onToken?.(''),
        });
      }
    };

    if (!window.grecaptcha) {
      const existing = document.getElementById('recaptcha-script');
      if (!existing) {
        const s = document.createElement('script');
        s.id = 'recaptcha-script';
        s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        s.async = true;
        s.defer = true;
        document.body.appendChild(s);
      }
      const timer = setInterval(() => {
        if (window.grecaptcha?.render) {
          clearInterval(timer);
          render();
        }
      }, 300);
      return () => clearInterval(timer);
    }
    render();
    return undefined;
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="my-2" />;
}
