import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../api';

export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

export interface User {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  role_code: string;
  tenant_id: string;
  mill_name?: string;
}

export interface Tenant {
  tenant_id: string;
  mill_name: string;
  slug: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  loading: boolean;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  token: null,
  loading: true,
  activeRole: 'ADMIN',
  setActiveRole: () => {},
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRoleState] = useState<UserRole>('ADMIN');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [savedToken, savedUser, savedTenant, savedRole] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('auth_user'),
          AsyncStorage.getItem('auth_tenant'),
          AsyncStorage.getItem('active_role'),
        ]);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          if (savedTenant) setTenant(JSON.parse(savedTenant));
          if (savedRole) setActiveRoleState(savedRole as UserRole);
        }
      } catch (err) {
        console.error('Error restoring auth session:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    AsyncStorage.setItem('active_role', role);
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res: any = await ApiService.login({ username, password });
      setToken(res.access_token);
      setUser(res.user);
      setTenant(res.tenant);

      await Promise.all([
        AsyncStorage.setItem('auth_token', res.access_token),
        AsyncStorage.setItem('auth_user', JSON.stringify(res.user)),
        AsyncStorage.setItem('auth_tenant', JSON.stringify(res.tenant)),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setTenant(null);
    await Promise.all([
      AsyncStorage.removeItem('auth_token'),
      AsyncStorage.removeItem('auth_user'),
      AsyncStorage.removeItem('auth_tenant'),
      AsyncStorage.removeItem('active_role'),
    ]);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, token, loading, activeRole, setActiveRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
