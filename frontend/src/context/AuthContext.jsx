import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default axios header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/users/profile');
          setUser(res.data);
        } catch (err) {
          console.error(err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  // Initialize socket when user logs in
  useEffect(() => {
    if (user?.id) {
      const newSocket = io();
      newSocket.on('connect', () => {
        newSocket.emit('authenticate', user.id);
      });
      setSocket(newSocket);
      return () => newSocket.close();
    } else {
      setSocket(null);
    }
  }, [user?.id]);

  const login = async (phone_number, password) => {
    const res = await axios.post('/api/auth/login', { phone_number, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, phone_number, password) => {
    const res = await axios.post('/api/auth/register', { name, phone_number, password });
    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (socket) socket.close();
  };

  return (
    <AuthContext.Provider value={{ user, token, socket, login, register, logout, loading, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
