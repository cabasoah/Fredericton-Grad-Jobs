import { useEffect, useState } from 'react';
import logo from '@/assets/images/logo.png';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu';
import { useAuth } from '@/auth/AuthContext';
import { buttonPrimary, pageContainer } from '@/lib/styles';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

const Navbar = () => {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigating.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const onLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      void navigate('/');
    } catch (err) {
      console.error('Error signing out', err);
    }
  };

  // Page links, in a row (md and up) or a column (mobile menu).
  const pageLinks = (
    <>
      <NavLink to="/" end className={linkClass}>Home</NavLink>
      <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
      {user?.role === 'SEEKER' && (
        <>
          <NavLink to="/tracker" className={linkClass}>Tracker</NavLink>
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        </>
      )}
      {/* Only employers can post; signed-out visitors are sent to log in. */}
      {(!user || user.role === 'EMPLOYER') && (
        <NavLink to="/add-job" className={linkClass}>Post a job</NavLink>
      )}
    </>
  );

  const accountLinks = status === 'ready' && (user ? (
    <>
      <span className="flex min-w-0 items-center gap-2 px-2 text-sm text-slate-700" title={user.name}>
        <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="truncate max-w-40">{user.name}</span>
      </span>
      <button
        type="button"
        onClick={() => void onLogout()}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <LuLogOut aria-hidden /> Log out
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={linkClass}>Log in</NavLink>
      <Link to="/register" className={`${buttonPrimary} h-9`}>Sign up</Link>
    </>
  ));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <nav aria-label="Main">
      <div className={`${pageContainer} flex h-16 items-center justify-between gap-4`}>
        <Link className="flex shrink-0 items-center gap-3" to="/">
          <img className="h-9 w-auto" src={logo} alt="" />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold text-slate-900">Fredericton Grad Jobs</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">NB &amp; Atlantic</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">{pageLinks}</div>
        <div className="hidden md:flex items-center gap-1">{accountLinks}</div>

        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-controls="mobile-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          {menuOpen ? <LuX className="text-xl" aria-hidden /> : <LuMenu className="text-xl" aria-hidden />}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-200 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {pageLinks}
          <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-2">{accountLinks}</div>
        </div>
      )}
      </nav>
    </header>
  )
}

export default Navbar
