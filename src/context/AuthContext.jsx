import { createContext, useState, useEffect } from 'react';
import { loginCall, registerCall } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser({ username });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const res = await loginCall(credentials);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('username', credentials.username);
      setUser({ username: credentials.username });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Error al iniciar sesión' };
    }
  };

  const register = async (userData) => {
    try {
      await registerCall(userData);
      return await login({ username: userData.username, password: userData.password });
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Error al registrarse' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
