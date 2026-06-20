import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200"
          alt="Football turf"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-turf-900/40" />
        <div className="absolute bottom-0 p-12">
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Your pitch. <br /> Your time. <br /> <span className="text-turf-400">Book it in seconds.</span>
          </h2>
          <p className="mt-4 max-w-md text-ink-300">
            Reserve premium turf slots, pay securely with bKash, and join exciting football events.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink-400">{footer}</div>}
          <Link to="/" className="mt-8 inline-block text-sm text-ink-500 hover:text-turf-300">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
