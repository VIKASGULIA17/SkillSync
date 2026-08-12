import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user ? user.role === 'admin' : false;

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await getMe();
          setUser(profile);
        } catch (err) {
          console.error("Failed to restore auth session:", err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  async function login(email, password) {
    setError(null);
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      localStorage.setItem('token', data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signup(email, password, fullName) {
    setError(null);
    setLoading(true);
    try {
      const data = await apiSignup(email, password, fullName);
      localStorage.setItem('token', data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Signup failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, isAdmin, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
