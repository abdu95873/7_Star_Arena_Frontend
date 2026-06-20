import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import { Button } from './ui.jsx';

const links = [
  { to: '/#book', label: 'Book a Slot' },
  { to: '/#events', label: 'Events' },
  { to: '/#gallery', label: 'Gallery' },
  { to: '/#contact', label: 'Contact' },
];

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="text-sm font-medium text-ink-300 transition hover:text-turf-300">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Button as={Link} to="/admin" variant="outline" className="!py-2">
                  Admin
                </Button>
              )}
              <Button as={Link} to="/dashboard" variant="ghost" className="!py-2">
                {user?.name?.split(' ')[0] || 'Account'}
              </Button>
              <Button variant="primary" className="!py-2" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" className="!py-2">
                Login
              </Button>
              <Button as={Link} to="/register" variant="primary" className="!py-2">
                Sign up
              </Button>
            </>
          )}
        </div>

        <button className="rounded-lg p-2 text-ink-200 hover:bg-white/5 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-800 bg-ink-950 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <a key={l.to} href={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-ink-200 hover:bg-white/5">
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-ink-800 pt-3">
              {isAuthenticated ? (
                <>
                  {isAdmin && (
                    <Button as={Link} to="/admin" variant="outline" onClick={() => setOpen(false)}>
                      Admin Panel
                    </Button>
                  )}
                  <Button as={Link} to="/dashboard" variant="ghost" onClick={() => setOpen(false)}>
                    My Dashboard
                  </Button>
                  <Button variant="primary" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="ghost" onClick={() => setOpen(false)}>
                    Login
                  </Button>
                  <Button as={Link} to="/register" variant="primary" onClick={() => setOpen(false)}>
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
