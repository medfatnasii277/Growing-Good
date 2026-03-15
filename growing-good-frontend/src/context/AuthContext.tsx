import { useEffect, useState, type ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { User } from '../types';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!user) {
      authAPI
        .me()
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        });
    }
  }, [token, user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password });
    setToken(response.data.token);
    setUser(response.data.user);
  };

  const register = async (username: string, password: string, role?: 'admin' | 'user') => {
    const response = await authAPI.register({ username, password, role });
    setToken(response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'admin',
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
