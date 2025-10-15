'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '@/types';
import { getCurrentUser } from '@/lib/actions/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário autenticado via cookie
    const checkAuth = async () => {
      try {
        // Fazer uma requisição para verificar autenticação
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log('Usuário não autenticado');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    // Esta função não é mais usada diretamente
    // O login agora é feito via Server Actions no componente LoginFormServer
    console.log('Login via Server Actions');
  };

  const logout = async (): Promise<void> => {
    // Logout será feito via Server Actions
    setUser(null);
  };

  const registerUserAccount = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordChanged'>): Promise<void> => {
    // Esta função não é mais usada diretamente
    // O cadastro agora é feito via Server Actions
    console.log('Register via Server Actions');
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (!user) throw new Error('Usuário não logado');
    
    // Esta função não é mais usada diretamente
    // A atualização de senha agora é feita via Server Actions
    console.log('Update password via Server Actions');
  };

  const updateProfile = async (profileData: Partial<User>): Promise<void> => {
    if (!user) throw new Error('Usuário não logado');
    
    // Esta função não é mais usada diretamente
    // A atualização de perfil agora é feita via Server Actions
    console.log('Update profile via Server Actions');
  };

  // Função para atualizar o usuário após login bem-sucedido
  const updateUser = (newUser: User | null) => {
    setUser(newUser);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    registerUser: registerUserAccount,
    updatePassword,
    updateProfile,
    loading,
    updateUser, // Adicionar função para atualizar usuário
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
