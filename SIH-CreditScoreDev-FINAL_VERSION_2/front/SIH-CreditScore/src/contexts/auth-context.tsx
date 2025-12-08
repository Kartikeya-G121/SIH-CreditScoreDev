'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/services/auth-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  users: User[]; // Kept for compatibility but will be empty/unused
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('credit-assist-token');
        const storedUser = localStorage.getItem('credit-assist-user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Normalize role for existing sessions (fix for stale 'admin'/'loan_officer' roles)
          if (['admin', 'loan_officer'].includes(parsedUser.role)) {
            parsedUser.role = 'officer';
            localStorage.setItem('credit-assist-user', JSON.stringify(parsedUser));
          }
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to restore auth session', error);
        localStorage.removeItem('credit-assist-token');
        localStorage.removeItem('credit-assist-user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
      if (!password) {
        console.error('Password is required for real authentication');
        return false;
      }

      const response = await authService.login({ username: email, password });

      if (response) {
        const { accessToken, userId, email: userEmail, role } = response;

        // Map backend response to frontend User type
        const newUser: User = {
          id: userId.toString(),
          name: userEmail.split('@')[0], // Fallback name
          email: userEmail,
          avatar: `https://ui-avatars.com/api/?name=${userEmail}`,
          role: (['admin', 'loan_officer', 'officer'].includes(role.toLowerCase()) ? 'officer' : 'beneficiary') as 'beneficiary' | 'officer',
          region: 'National', // Default
        };

        // Store token and user
        localStorage.setItem('credit-assist-token', accessToken);
        localStorage.setItem('credit-assist-user', JSON.stringify(newUser));

        setUser(newUser);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login failed:', error);

      // Check if error is due to inactive account
      const errorMessage = error?.message || '';
      if (errorMessage.toLowerCase().includes('account is inactive') ||
        errorMessage.toLowerCase().includes('verify otp')) {
        // Store the email/phone for OTP verification
        const isEmail = email.includes('@');
        if (isEmail) {
          localStorage.setItem('pending-registration-email', email);
        } else {
          localStorage.setItem('pending-registration-phone', email);
        }

        // Redirect to OTP verification page
        const redirectUrl = isEmail
          ? `/verify-otp?email=${encodeURIComponent(email)}`
          : `/verify-otp?phone=${encodeURIComponent(email)}`;

        router.push(redirectUrl);

        // Return a special value to indicate redirect happened
        throw new Error('REDIRECT_TO_OTP');
      }

      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('credit-assist-token');
    localStorage.removeItem('credit-assist-user');
    router.push('/login');
  };

  const switchUser = (userId: string) => {
    // Deprecated in real auth, but kept for interface compatibility
    console.warn('switchUser is not supported in real auth mode');
  };

  const value = { user, loading, login, logout, users: [], switchUser };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="w-full h-screen flex items-center justify-center"><Skeleton className="h-full w-full" /></div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}