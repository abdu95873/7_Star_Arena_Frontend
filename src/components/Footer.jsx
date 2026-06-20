import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-ink-400">
            Premium football turf booking & management. Reserve your slot, pay with bKash, and play.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Explore</h4>
          <ul className="space-y-2 text-sm text-ink-400">
            <li><a href="/#book" className="hover:text-turf-300">Book a Slot</a></li>
            <li><a href="/#events" className="hover:text-turf-300">Events</a></li>
            <li><a href="/#gallery" className="hover:text-turf-300">Gallery</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Account</h4>
          <ul className="space-y-2 text-sm text-ink-400">
            <li><a href="/login" className="hover:text-turf-300">Login</a></li>
            <li><a href="/register" className="hover:text-turf-300">Sign up</a></li>
            <li><a href="/dashboard" className="hover:text-turf-300">My Bookings</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Contact</h4>
          <ul className="space-y-2 text-sm text-ink-400">
            <li>📞 01700-000000</li>
            <li>✉️ hello@turf.example</li>
            <li>📍 Gulshan Avenue, Dhaka</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800 py-5 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} 7 Star Arena. All rights reserved.
      </div>
    </footer>
  );
}
