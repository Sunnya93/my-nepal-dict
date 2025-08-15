'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드 시 localStorage에서 인증 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('admin-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('admin-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (userId: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Firestore Users 컬렉션에서 사용자 확인
      const usersRef = collection(db, 'Users');
      const q = query(usersRef, where('UserId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return false;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;
      
      // 비밀번호 확인 (실제 환경에서는 해시된 비밀번호와 비교해야 함)
      if (userData.PassWord === password) {
        const userWithId = { ...userData, id: userDoc.id };
        setUser(userWithId);
        localStorage.setItem('admin-user', JSON.stringify(userWithId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin-user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
