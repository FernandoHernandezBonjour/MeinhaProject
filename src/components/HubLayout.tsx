'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FinancialPage } from './FinancialPage';
import { HomePage } from './HomePage';
import { EventsPage } from './EventsPage';
import { MediaPage } from './MediaPage';
import { ForumPage } from './ForumPage';
import { NotificationSystem } from './NotificationSystem';
import { AdminPanel } from './AdminPanel';
import { QuickActionsFab } from './QuickActionsFab';
import { UserRegistration } from './UserRegistration';
import { ProfileEditForm } from './ProfileEditForm';
import { PasswordChangeForm } from './PasswordChangeForm';

type TabType = 'home' | 'events' | 'financial' | 'media' | 'forum' | 'admin';

export const HubLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleSetTab = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: TabType }>;
      const nextTab = customEvent.detail?.tab;
      if (!nextTab) return;
      if (!isAdmin && nextTab === 'admin') {
        return;
      }
      setActiveTab(nextTab);
    };

    window.addEventListener('hub-set-tab', handleSetTab as EventListener);
    return () => {
      window.removeEventListener('hub-set-tab', handleSetTab as EventListener);
    };
  }, [isAdmin]);

  useEffect(() => {
    const handleOpenUser = () => setShowUserModal(true);
    const handleOpenProfile = () => setShowProfileModal(true);
    const handleOpenPassword = () => setShowPasswordModal(true);

    window.addEventListener('menu:open-user-registration', handleOpenUser);
    window.addEventListener('profile:open', handleOpenProfile);
    window.addEventListener('password:open', handleOpenPassword);

    return () => {
      window.removeEventListener('menu:open-user-registration', handleOpenUser);
      window.removeEventListener('profile:open', handleOpenProfile);
      window.removeEventListener('password:open', handleOpenPassword);
    };
  }, []);

  useEffect(() => {
    if (user && (user.hashedPassword == null)) {
      setShowPasswordModal(true);
    }
  }, [user]);

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'events', label: 'Rolês', icon: '🎉' },
    { id: 'financial', label: 'Financeiro', icon: '💰' },
    { id: 'media', label: 'Mídia', icon: '📸' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: '🛡️ Administração', icon: '🛡️' });
  }

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = '/';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'events':
        return <EventsPage />;
      case 'financial':
        return <FinancialPage />;
      case 'media':
        return <MediaPage />;
      case 'forum':
        return <ForumPage />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <HomePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 shadow-md border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-2xl font-black text-white drop-shadow-lg">
              🐷 Hub Meinha Games
            </h1>
            <div className="flex items-center space-x-3">
              <NotificationSystem />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  onMouseEnter={() => setMenuOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <div className="text-right text-white">
                    <div className="flex items-center justify-end space-x-2">
                      <p className="font-bold text-base">{user?.username}</p>
                      {isAdmin && (
                        <span className="px-2 py-0.5 text-xs font-black uppercase bg-yellow-300 text-red-700 border border-black rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-full border-2 border-black overflow-hidden flex items-center justify-center">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">🐷</span>
                    )}
                  </div>
                </button>
                {menuOpen && (
                  <div
                    onMouseLeave={() => setMenuOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-xl shadow-lg z-50"
                  >
                    <div className="py-2">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserModal(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                        >
                          📋 Cadastrar vítima
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowProfileModal(true);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                      >
                        👤 Meu perfil
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordModal(true);
                          setMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                      >
                        🔒 Alterar senha
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-white text-red-600 font-black rounded-md border-2 border-black hover:bg-red-100 transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-md border-b-2 border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg transform scale-105 border-2 border-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-bold mb-2">🐷 Hub Meinha Games</p>
          <p className="text-sm text-gray-400">
            Finanças, zoeira e humilhação pública, tudo num só lugar
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © 2024 - A vergonha continua
          </p>
        </div>
      </footer>
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-black shadow-2xl">
            <UserRegistration
              onSuccess={() => setShowUserModal(false)}
              onCancel={() => setShowUserModal(false)}
            />
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full border-4 border-black shadow-2xl">
            <ProfileEditForm
              onSuccess={() => setShowProfileModal(false)}
              onCancel={() => setShowProfileModal(false)}
            />
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full border-4 border-black shadow-2xl">
            <PasswordChangeForm
              onSuccess={() => setShowPasswordModal(false)}
              onCancel={() => setShowPasswordModal(false)}
              forced={!!user && (user.hashedPassword == null)}
            />
          </div>
        </div>
      )}
      <QuickActionsFab />
    </div>
  );
};
