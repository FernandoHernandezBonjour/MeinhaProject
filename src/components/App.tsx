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
      const bgImage = Math.random() < 0.1 ? '/images/negao_da_picona.jpg' : '/images/back.jpg';
      return (
        <div
          className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
        <div className="text-center bg-white/60 backdrop-blur-sm p-8 rounded-2xl border-4 border-black shadow-2xl">
          <div className="animate-spin rounded-full h-32 w-32 border-8 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-2xl font-black text-red-600">Carregando os caloteiros...</p>
        </div>
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
