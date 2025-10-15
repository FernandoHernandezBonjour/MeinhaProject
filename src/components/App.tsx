'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginFormServer } from './LoginFormServer';
import { PasswordChangeForm } from './PasswordChangeForm';
import { ProfileCompletionForm } from './ProfileCompletionForm';
import { Dashboard } from './Dashboard';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Se não há usuário logado, mostrar login
  if (!user) {
    return <LoginFormServer />;
  }

  // Se o usuário não alterou a senha, mostrar tela de alteração obrigatória
  if (!user.passwordChanged) {
    return (
      <PasswordChangeForm
        onSuccess={() => {
          // Após alterar a senha, perguntar se quer completar o perfil
          setShowProfileCompletion(true);
        }}
      />
    );
  }

  // Se acabou de alterar a senha e quer completar o perfil
  if (showProfileCompletion) {
    return (
      <ProfileCompletionForm
        onSuccess={() => setShowProfileCompletion(false)}
        onSkip={() => setShowProfileCompletion(false)}
      />
    );
  }

  // Usuário logado e com senha alterada, mostrar dashboard
  return <Dashboard />;
};
