import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const { user, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function handleLinkClick() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    handleLinkClick();
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-[64px] bg-bg-secondary/95 backdrop-blur-md border-b border-border z-[1100] flex items-center transition-colors duration-500 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 w-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline text-xl font-extrabold tracking-tight z-[1102]" onClick={handleLinkClick}>
          <div className="w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="origin-[12px_12px] animate-[spin_12s_linear_infinite]" d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9" stroke="url(#nav-grad-1)" strokeWidth="2.5" strokeLinecap="round" />
              <path className="origin-[12px_12px] animate-[spin_8s_linear_infinite_reverse]" d="M12 21a9 9 0 0 1-9-9 9 9 0 0 1 9-9" stroke="url(#nav-grad-2)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" style={{ color: 'var(--color-primary)' }} />
              <defs>
                <linearGradient id="nav-grad-1" x1="12" y1="3" x2="21" y2="12" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3ecf8e" />
                  <stop offset="100%" stopColor="#04b275" />
                </linearGradient>
                <linearGradient id="nav-grad-2" x1="12" y1="21" x2="3" y2="12" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2e2e2e" />
                  <stop offset="100%" stopColor="#3ecf8e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="font-headings font-bold text-text-primary tracking-tight transition-colors duration-500">SkillSync</span>
        </Link>

        <button
          className="hidden max-lg:flex flex-col justify-center gap-[5px] w-10 h-10 p-2 bg-transparent border-none cursor-pointer rounded-md transition-all duration-300 hover:bg-bg-tertiary active:scale-95 z-[1002]"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={`block w-full h-[2.5px] bg-text-secondary rounded-full transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-[7.5px] !bg-primary' : ''}`} />
          <span className={`block w-full h-[2.5px] bg-text-secondary rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-75' : ''}`} />
          <span className={`block w-full h-[2.5px] bg-text-secondary rounded-full transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-[7.5px] !bg-primary' : ''}`} />
        </button>

        <div className={`flex items-center gap-1 transition-all duration-300 max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:bottom-0 max-lg:w-[320px] max-lg:h-screen max-lg:flex-col max-lg:bg-bg-secondary/98 max-lg:backdrop-blur-xl max-lg:border-l max-lg:border-border max-lg:pt-20 max-lg:px-6 max-lg:pb-8 max-lg:gap-1 max-lg:z-[1001] max-lg:shadow-2xl max-lg:items-stretch max-lg:overflow-y-auto ${menuOpen ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full'}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="text-base leading-none">🏠</span>
            <span className="font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/analyze"
            className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="text-base leading-none">🔍</span>
            <span className="font-medium">Analyze</span>
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="text-base leading-none">📈</span>
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/tracker"
            className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="text-base leading-none">📋</span>
            <span className="font-medium">Tracker</span>
          </NavLink>
          <NavLink
            to="/jobs"
            className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="text-base leading-none">💼</span>
            <span className="font-medium">Jobs</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="text-base leading-none">⚙️</span>
            <span className="font-medium">Settings</span>
          </NavLink>
          {user && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all duration-200 relative max-lg:px-4 max-lg:py-3 max-lg:rounded-lg max-lg:mb-1 ${isActive ? 'text-text-primary bg-bg-tertiary border-b-2 border-primary lg:rounded-b-none max-lg:border-b-0 max-lg:border-l-3 max-lg:border-l-primary max-lg:rounded-l-none max-lg:bg-primary/10' : ''}`}
              onClick={handleLinkClick}
            >
              <span className="text-base leading-none">🛡️</span>
              <span className="font-medium">Admin</span>
            </NavLink>
          )}

          {user ? (
            <>
              <div className="max-lg:border-t max-lg:border-border max-lg:mt-3 max-lg:pt-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-4 py-3 border-l border-border max-lg:border-l-0 max-lg:border-0 hover:bg-bg-tertiary rounded-md transition-all duration-200 no-underline cursor-pointer max-lg:mb-2"
                  onClick={handleLinkClick}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate max-w-[120px] max-lg:max-w-none">
                    {user.full_name}
                  </span>
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-error hover:bg-error-bg transition-all duration-200 border border-transparent cursor-pointer max-lg:w-full max-lg:justify-center max-lg:mt-1 max-lg:border-error/20 max-lg:py-3"
              >
                <span className="text-base leading-none">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary btn-sm ml-2 max-lg:ml-0 max-lg:mt-4 text-center cursor-pointer max-lg:py-3"
              onClick={handleLinkClick}
            >
              Sign In
            </Link>
          )}

          <button
            className="w-10 h-10 rounded-md bg-transparent text-text-secondary flex items-center justify-center transition-all duration-200 border border-transparent hover:text-text-primary hover:bg-bg-tertiary hover:border-border max-lg:ml-0 max-lg:mt-3 max-lg:w-full max-lg:h-12 max-lg:border-border max-lg:bg-bg-tertiary/50"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className={`fixed top-[64px] left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[1099] transition-opacity duration-300 max-lg:block hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuOpen(false)} />
    </nav>
  );
}
