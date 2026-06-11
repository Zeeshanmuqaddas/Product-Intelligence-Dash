import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('apollo_auth_token');
    const storedUser = localStorage.getItem('apollo_auth_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('apollo_auth_token');
        localStorage.removeItem('apollo_auth_user');
      }
    }
  }, []);

  const login = (email: string, token: string) => {
    const newUser = { email, role: 'admin' };
    setUser(newUser);
    localStorage.setItem('apollo_auth_token', token); // Simulated JWT
    localStorage.setItem('apollo_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apollo_auth_token');
    localStorage.removeItem('apollo_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
