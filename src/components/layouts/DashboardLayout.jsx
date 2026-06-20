import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../Logo.jsx';
import { Button } from '../ui.jsx';

const tabs = [
  { to: '/dashboard', label: 'My Bookings', icon: '🗓️', end: true },
  { to: '/dashboard/events', label: 'My Events', icon: '🏆' },
  { to: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

export default function DashboardLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="border-b border-ink-800 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button as={NavLink} to="/admin" variant="outline" className="!py-2">
                Admin
              </Button>
            )}
            <Button variant="ghost" className="!py-2" onClick={async () => { await logout(); navigate('/'); }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-ink-400">Manage your bookings, events, and profile.</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="md:w-56 md:shrink-0">
            <nav className="flex gap-2 overflow-x-auto md:flex-col">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-turf-500/15 text-turf-300 ring-1 ring-turf-500/30' : 'text-ink-300 hover:bg-white/5'
                    }`
                  }
                >
                  <span>{t.icon}</span> {t.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <section className="flex-1">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}
