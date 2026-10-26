import logo from '@/assets/images/logo.png';
import{NavLink, useNavigate} from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';

const Navbar = () => {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({isActive}: {isActive: boolean}) => isActive ? "bg-black text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2" : "text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2"

  const onLogout = async () => {
    try {
      await logout();
      void navigate('/');
    } catch (err) {
      console.error('Error signing out', err);
    }
  };
  return (
      <nav className="bg-indigo-700 border-b border-indigo-500">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div
              className="flex flex-1 items-center justify-center md:items-stretch md:justify-start"
            >
              <NavLink className="flex flex-shrink-0 items-center mr-4" to="/">
                <img
                  className="h-10 w-auto"
                  src={logo}
                  alt="Fredericton Grad Jobs"
                />
                <span className="hidden md:block text-white text-2xl font-bold ml-2"
                  >Fredericton Grad Jobs</span
                >
              </NavLink>
              <div className="md:ml-auto">
                <div className="flex items-center space-x-2">
                  <NavLink
                    to="/"
                    className={linkClass}
                    >Home</NavLink>
                  <NavLink
                    to="/jobs"
                     className={linkClass}
                    >Jobs</NavLink>
                  {/* Only employers can post; signed-out visitors are sent to log in. */}
                  {(!user || user.role === 'EMPLOYER') && (
                    <NavLink
                      to="/add-job"
                       className={linkClass}
                      >Add Job</NavLink>
                  )}
                  {status === 'ready' && (user ? (
                    <>
                      <span className="hidden sm:inline text-indigo-100 px-2">{user.name}</span>
                      <button
                        onClick={() => void onLogout()}
                        className="text-white hover:bg-gray-900 rounded-md px-3 py-2"
                        >Logout</button>
                    </>
                  ) : (
                    <>
                      <NavLink to="/login" className={linkClass}>Login</NavLink>
                      <NavLink to="/register" className={linkClass}>Register</NavLink>
                    </>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
  )
}

export default Navbar