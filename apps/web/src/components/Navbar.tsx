import { useEffect, useState } from 'react';
import logo from '@/assets/images/logo.png';
import{NavLink, useLocation, useNavigate} from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/auth/AuthContext';

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

  const linkClass = ({isActive}: {isActive: boolean}) => isActive ? "bg-black text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2" : "text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2"

  const onLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      void navigate('/');
    } catch (err) {
      console.error('Error signing out', err);
    }
  };

  // The same links, laid out in a row (md and up) or a column (mobile menu).
  const links = (
    <>
      <NavLink to="/" className={linkClass}>Home</NavLink>
      <NavLink to="/jobs" className={linkClass}>Jobs</NavLink>
      {/* Only employers can post; signed-out visitors are sent to log in. */}
      {(!user || user.role === 'EMPLOYER') && (
        <NavLink to="/add-job" className={linkClass}>Add Job</NavLink>
      )}
      {user?.role === 'SEEKER' && (
        <>
          <NavLink to="/tracker" className={linkClass}>Tracker</NavLink>
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        </>
      )}
      {status === 'ready' && (user ? (
        <>
          <span className="text-indigo-100 px-3 py-2 truncate max-w-48" title={user.name}>{user.name}</span>
          <button
            onClick={() => void onLogout()}
            className="text-white hover:bg-gray-900 rounded-md px-3 py-2 text-left"
            >Logout</button>
        </>
      ) : (
        <>
          <NavLink to="/login" className={linkClass}>Login</NavLink>
          <NavLink to="/register" className={linkClass}>Register</NavLink>
        </>
      ))}
    </>
  );

  return (
      <nav className="bg-indigo-700 border-b border-indigo-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4">
              <NavLink className="flex flex-shrink-0 items-center" to="/">
                <img
                  className="h-10 w-auto"
                  src={logo}
                  alt="Fredericton Grad Jobs"
                />
                <span className="hidden lg:block text-white text-2xl font-bold ml-2"
                  >Fredericton Grad Jobs</span
                >
              </NavLink>

              <div className="hidden md:flex items-center space-x-2">
                {links}
              </div>

              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
                {menuOpen ? <FaTimes className="text-xl" aria-hidden /> : <FaBars className="text-xl" aria-hidden />}
              </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-indigo-500 px-4 pb-4 pt-2 flex flex-col gap-1">
            {links}
          </div>
        )}
      </nav>
  )
}

export default Navbar
