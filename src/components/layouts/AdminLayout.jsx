import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../Logo.jsx';
import { Button } from '../ui.jsx';

const nav = [
  { to: '/admin', label: 'Analytics', icon: '📊', end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: '🗓️' },
  { to: '/admin/slots', label: 'Slots', icon: '🟩' },
  { to: '/admin/venues', label: 'Venues', icon: '🏟️' },
  { to: '/admin/events', label: 'Events', icon: '🏆' },
  { to: '/admin/finance', label: 'Finance', icon: '💳' },
  { to: '/admin/contact', label: 'Messages', icon: '✉️' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <nav className="flex flex-col gap-1 p-4">
      {nav.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-turf-500 text-white shadow-glow' : 'text-ink-300 hover:bg-white/5'
            }`
          }
        >
          <span>{n.icon}</span> {n.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-950 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-ink-800 bg-ink-900/40 lg:block">
        <div className="border-b border-ink-800 p-4">
          <Logo to="/admin" />
        </div>
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-ink-800 bg-ink-900">
            <div className="border-b border-ink-800 p-4"><Logo to="/admin" /></div>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink-800 bg-ink-950/70 px-4 py-3 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-ink-200 hover:bg-white/5 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="hidden lg:block">
            <h2 className="font-semibold text-white">Admin Console</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-400 sm:inline">{user?.name} · {user?.role}</span>
            <Button as={NavLink} to="/" variant="ghost" className="!py-2">Site</Button>
            <Button variant="outline" className="!py-2" onClick={async () => { await logout(); navigate('/'); }}>Logout</Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
