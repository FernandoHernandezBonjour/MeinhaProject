'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FinancialPage } from './FinancialPage';
import { HomePage } from './HomePage';
import { EventsPage } from './EventsPage';
import { MediaPage } from './MediaPage';
import { ForumPage } from './ForumPage';
import { ChangelogPage } from './ChangelogPage';
import { NotificationSystem } from './NotificationSystem';
import { AdminPanel } from './AdminPanel';
import { QuickActionsFab } from './QuickActionsFab';
import { UserRegistration } from './UserRegistration';
import { ProfileEditForm } from './ProfileEditForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { UserProfilePage } from './UserProfilePage';

type TabType = 'home' | 'events' | 'financial' | 'media' | 'forum' | 'changelog' | 'admin' | 'profile';

export const HubLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, layoutMode, toggleTheme, setTheme, setThemeAndLayout, toggleXvideosMode, toggleSovietMode, togglePatriotaMode, isXvideosMode, isSovietMode, isPatriotaMode } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | undefined>(undefined);
  const [profileUserId, setProfileUserId] = useState<string | undefined>(undefined);
  const isAdmin = user?.role === 'admin';
  const panicUrl = 'https://wa.me/5551989344482?text=vai%20toma%20no%20cu%20luis%2C%20filha%20da%20puta.';

  const getUserInitials = (u?: { username?: string; name?: string }) => {
    const base = u?.name || u?.username || '';
    const parts = base.trim().split(/\s+/).slice(0, 2);
    if (parts.length === 0 || parts[0] === '') return '🐷';
    const initials = parts.map((p) => p[0]?.toUpperCase()).join('');
    return initials || '🐷';
  };

  const Avatar: React.FC<{ size: 'sm' | 'md' }> = ({ size }) => {
    const [broken, setBroken] = React.useState(false);
    const isSm = size === 'sm';
    const box = isSm ? 'w-9 h-9 border border-gray-300' : 'w-10 h-10 border-2 border-black';
    const text = isSm ? 'text-sm' : 'text-base';
    return (
      <div
        className={`${box} rounded-full overflow-hidden flex items-center justify-center bg-gray-200`}
        title={user?.username || user?.name}
      >
        {user?.photoURL && !broken ? (
          <img
            src={user.photoURL}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className={`${text} font-extrabold text-gray-900`}>{getUserInitials(user as any)}</span>
        )}
      </div>
    );
  };

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

    const handleOpenProfile = (event: Event) => {
      const customEvent = event as CustomEvent<{ username?: string; userId?: string }>;
      const { username, userId } = customEvent.detail || {};
      setProfileUsername(username);
      setProfileUserId(userId);
      setActiveTab('profile');
    };

    window.addEventListener('hub-set-tab', handleSetTab as EventListener);
    window.addEventListener('profile:open', handleOpenProfile as EventListener);
    
    return () => {
      window.removeEventListener('hub-set-tab', handleSetTab as EventListener);
      window.removeEventListener('profile:open', handleOpenProfile as EventListener);
    };
  }, [isAdmin]);

  useEffect(() => {
    const handleOpenUser = () => setShowUserModal(true);
    const handleOpenProfileEdit = () => setShowProfileModal(true);
    const handleOpenPassword = () => setShowPasswordModal(true);

    window.addEventListener('menu:open-user-registration', handleOpenUser);
    window.addEventListener('profile:edit', handleOpenProfileEdit);
    window.addEventListener('password:open', handleOpenPassword);

    return () => {
      window.removeEventListener('menu:open-user-registration', handleOpenUser);
      window.removeEventListener('profile:edit', handleOpenProfileEdit);
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
    { id: 'forum', label: 'Fórum', icon: '💬' },
    { id: 'changelog', label: 'Changelog', icon: '📜' },
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
      case 'changelog':
        return <ChangelogPage />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <HomePage />;
      case 'profile':
        return <UserProfilePage username={profileUsername} userId={profileUserId} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isXvideosMode 
        ? 'bg-gray-100 dark:bg-black' 
        : isSovietMode
        ? ''
        : isPatriotaMode
        ? ''
        : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
    } ${isSovietMode ? 'soviet-mode' : ''} ${isPatriotaMode ? 'patriota-mode' : ''}`}>
      {/* Header */}
      <header className={`transition-colors duration-200 ${
        isXvideosMode
          ? 'bg-white border-b border-gray-200'
          : isSovietMode
          ? 'soviet-header'
          : isPatriotaMode
          ? 'patriota-header'
          : 'bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-800 dark:to-orange-800 shadow-md border-b-4 border-black dark:border-gray-700'
      }`}>
        <div className={`${isXvideosMode || isSovietMode || isPatriotaMode ? 'px-4 sm:px-6 lg:px-8 py-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2'}`}>
          {isXvideosMode ? (
            <div className="h-14 flex items-center justify-between">
              {/* Left group: logo */}
              <div className="flex items-center gap-3">
                <span className="xvideos-logo text-2xl">XVIDEOS MEINHA</span>
              </div>

              {/* Right group: xvideos toggle + notifications + theme + user + logout */}
              <div className="flex items-center gap-2">
                <a
                  href={panicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded border border-red-700 shadow"
                  title="Mandar o Luis toma no cu!"
                >
                  🆘 Mandar o Luis tomar no cu
                </a>
                <button
                  onClick={toggleXvideosMode}
                  className="p-2 rounded border border-gray-300 hover:bg-gray-100 text-gray-700"
                  title="Desativar modo XVIDEOS"
                >
                  🎬
                </button>
                <button
                  onClick={toggleSovietMode}
                  className="p-2 rounded border border-gray-300 hover:bg-gray-100 text-gray-700"
                  title="Ativar modo Soviético"
                >
                  ☭
                </button>
                <NotificationSystem />
                <div className="relative">
                  <button
                    onClick={() => setThemeMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setThemeMenuOpen(true)}
                    className="p-2 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                    title="Selecionar tema"
                  >
                    {layoutMode === 'normal' ? (theme === 'light' ? '☀️' : '🌙') : 
                     layoutMode === 'xvideos' ? '🎬' :
                     layoutMode === 'soviet' ? '☭' : '🇧🇷'}
                    <span className="text-xs">▼</span>
                  </button>
                  {themeMenuOpen && (
                    <div
                      onMouseLeave={() => setThemeMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">Normal</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'light' && layoutMode === 'normal' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>☀️</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'normal' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>🌙</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase border-t border-b border-gray-200 mt-1">XVIDEOS</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'light' && layoutMode === 'xvideos' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'xvideos' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase border-t border-b border-gray-200 mt-1">Soviético</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'light' && layoutMode === 'soviet' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>☭</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'soviet' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>☭</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase border-t border-b border-gray-200 mt-1">Patriota</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'light' && layoutMode === 'patriota' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'patriota' ? 'bg-blue-50 font-bold' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Escuro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setMenuOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <p className="font-semibold text-sm text-gray-800">{user?.username}</p>
                        {isAdmin && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-yellow-300 text-red-700 border border-black rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <Avatar size="sm" />
                  </button>
                  {menuOpen && (
                    <div
                      onMouseLeave={() => setMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50"
                    >
                      <div className="py-2">
                        {isAdmin && (
                          <button
                            onClick={() => { setShowUserModal(true); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            📋 Cadastrar vítima
                          </button>
                        )}
                        <button onClick={() => { setShowProfileModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">👤 Meu perfil</button>
                        <button onClick={() => { setShowPasswordModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">🔒 Alterar senha</button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-white text-red-600 font-bold rounded border border-gray-300 hover:bg-red-50 text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : isSovietMode ? (
            <div className="h-16 flex items-center justify-between">
              {/* Left group: logo */}
              <div className="flex items-center gap-3">
                <span className="soviet-logo text-2xl">HUB MEINHA SOVIÉTICO</span>
              </div>

              {/* Right group: soviet toggle + notifications + theme + user + logout */}
              <div className="flex items-center gap-2">
                <a
                  href={panicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-red-900 font-black rounded border-2 border-yellow-600 shadow-lg"
                  title="Mandar o Luis toma no cu!"
                >
                  🆘 Mandar o Luis tomar no cu
                </a>
                <button
                  onClick={toggleSovietMode}
                  className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold"
                  title="Desativar modo Soviético"
                >
                  ☭
                </button>
                <button
                  onClick={toggleXvideosMode}
                  className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold"
                  title="Ativar modo XVIDEOS"
                >
                  🎬
                </button>
                <NotificationSystem />
                <div className="relative">
                  <button
                    onClick={() => setThemeMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setThemeMenuOpen(true)}
                    className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold flex items-center gap-1"
                    title="Selecionar tema"
                  >
                    {layoutMode === 'normal' ? (theme === 'light' ? '☀️' : '🌙') : 
                     layoutMode === 'xvideos' ? '🎬' :
                     layoutMode === 'soviet' ? '☭' : '🇧🇷'}
                    <span className="text-xs">▼</span>
                  </button>
                  {themeMenuOpen && (
                    <div
                      onMouseLeave={() => setThemeMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-red-900 border-2 border-yellow-500 rounded shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-b border-yellow-700">Normal</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'normal' ? 'bg-red-800' : ''}`}
                        >
                          <span>☀️</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'normal' ? 'bg-red-800' : ''}`}
                        >
                          <span>🌙</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-t border-b border-yellow-700 mt-1">XVIDEOS</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'xvideos' ? 'bg-red-800' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'xvideos' ? 'bg-red-800' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-t border-b border-yellow-700 mt-1">Soviético</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'soviet' ? 'bg-red-800' : ''}`}
                        >
                          <span>☭</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'soviet' ? 'bg-red-800' : ''}`}
                        >
                          <span>☭</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-t border-b border-yellow-700 mt-1">Patriota</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'patriota' ? 'bg-red-800' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'patriota' ? 'bg-red-800' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Escuro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setMenuOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <p className="font-black text-sm text-yellow-500">{user?.username}</p>
                        {isAdmin && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-yellow-500 text-red-900 border-2 border-yellow-600 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <Avatar size="sm" />
                  </button>
                  {menuOpen && (
                    <div
                      onMouseLeave={() => setMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-red-900 border-2 border-yellow-500 rounded shadow-lg z-50"
                    >
                      <div className="py-2">
                        {isAdmin && (
                          <button
                            onClick={() => { setShowUserModal(true); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold"
                          >
                            📋 Cadastrar vítima
                          </button>
                        )}
                        <button onClick={() => { setShowProfileModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold">👤 Meu perfil</button>
                        <button onClick={() => { setShowPasswordModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-800 text-yellow-500 font-bold">🔒 Alterar senha</button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-yellow-500 text-red-900 font-black rounded border-2 border-yellow-600 hover:bg-yellow-600 text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : isPatriotaMode ? (
            <div className="h-16 flex items-center justify-between">
              {/* Left group: logo */}
              <div className="flex items-center gap-3">
                <span className="patriota-logo text-2xl">🇧🇷 HUB MEINHA PATRIOTA 🇧🇷</span>
              </div>

              {/* Right group: patriota toggle + notifications + theme + user + logout */}
              <div className="flex items-center gap-2">
                <a
                  href={panicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-green-900 font-black rounded border-2 border-yellow-600 shadow-lg"
                  title="Mandar o Luis toma no cu!"
                >
                  🆘 Mandar o Luis tomar no cu
                </a>
                <button
                  onClick={togglePatriotaMode}
                  className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold"
                  title="Desativar modo Patriota"
                >
                  🇧🇷
                </button>
                <button
                  onClick={toggleXvideosMode}
                  className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold"
                  title="Ativar modo XVIDEOS"
                >
                  🎬
                </button>
                <button
                  onClick={toggleSovietMode}
                  className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold"
                  title="Ativar modo Soviético"
                >
                  ☭
                </button>
                <NotificationSystem />
                <div className="relative">
                  <button
                    onClick={() => setThemeMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setThemeMenuOpen(true)}
                    className="p-2 rounded border-2 border-yellow-500 hover:bg-yellow-500/20 text-yellow-500 font-bold flex items-center gap-1"
                    title="Selecionar tema"
                  >
                    {layoutMode === 'normal' ? (theme === 'light' ? '☀️' : '🌙') : 
                     layoutMode === 'xvideos' ? '🎬' :
                     layoutMode === 'soviet' ? '☭' : '🇧🇷'}
                    <span className="text-xs">▼</span>
                  </button>
                  {themeMenuOpen && (
                    <div
                      onMouseLeave={() => setThemeMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-green-900 border-2 border-yellow-500 rounded shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-b border-yellow-700">Normal</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'normal' ? 'bg-green-800' : ''}`}
                        >
                          <span>☀️</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'normal' ? 'bg-green-800' : ''}`}
                        >
                          <span>🌙</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-t border-b border-yellow-700 mt-1">XVIDEOS</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'xvideos' ? 'bg-green-800' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'xvideos' ? 'bg-green-800' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-t border-b border-yellow-700 mt-1">Soviético</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'soviet' ? 'bg-green-800' : ''}`}
                        >
                          <span>☭</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'soviet' ? 'bg-green-800' : ''}`}
                        >
                          <span>☭</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-yellow-500 uppercase border-t border-b border-yellow-700 mt-1">Patriota</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'light' && layoutMode === 'patriota' ? 'bg-green-800' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold flex items-center gap-2 ${theme === 'dark' && layoutMode === 'patriota' ? 'bg-green-800' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Escuro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setMenuOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <p className="font-black text-sm text-yellow-500">{user?.username}</p>
                        {isAdmin && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-yellow-500 text-green-900 border-2 border-yellow-600 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                    <Avatar size="sm" />
                  </button>
                  {menuOpen && (
                    <div
                      onMouseLeave={() => setMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-green-900 border-2 border-yellow-500 rounded shadow-lg z-50"
                    >
                      <div className="py-2">
                        {isAdmin && (
                          <button
                            onClick={() => { setShowUserModal(true); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold"
                          >
                            📋 Cadastrar vítima
                          </button>
                        )}
                        <button onClick={() => { setShowProfileModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold">👤 Meu perfil</button>
                        <button onClick={() => { setShowPasswordModal(true); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-green-800 text-yellow-500 font-bold">🔒 Alterar senha</button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-yellow-500 text-green-900 font-black rounded border-2 border-yellow-600 hover:bg-yellow-600 text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
              <h1 className="text-2xl font-black text-white drop-shadow-lg">🐷 Hub Meinha Games</h1>
              <div className="flex items-center space-x-3">
                <a
                  href={panicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg border-2 border-red-800 shadow"
                  title="Mandar o Luis tomar no cu"
                >
                  🆘 Mandar o Luis tomar no cu
                </a>
                <button
                  onClick={toggleXvideosMode}
                  className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg border-2 border-white/30 dark:border-white/20 text-white"
                  title={'Ativar modo XVIDEOS Meinha'}
                >
                  🎬
                </button>
                <button
                  onClick={toggleSovietMode}
                  className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg border-2 border-white/30 dark:border-white/20 text-white"
                  title={'Ativar modo Soviético'}
                >
                  ☭
                </button>
                <button
                  onClick={togglePatriotaMode}
                  className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg border-2 border-white/30 dark:border-white/20 text-white text-xl"
                  title={'Ativar modo Patriota'}
                >
                  🇧🇷
                </button>
                <div className="relative">
                  <button
                    onClick={() => setThemeMenuOpen((prev) => !prev)}
                    onMouseEnter={() => setThemeMenuOpen(true)}
                    className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg border-2 border-white/30 dark:border-white/20 flex items-center gap-1"
                    title="Selecionar tema"
                  >
                    {layoutMode === 'normal' ? (theme === 'light' ? '☀️' : '🌙') : 
                     layoutMode === 'xvideos' ? '🎬' :
                     layoutMode === 'soviet' ? '☭' : '🇧🇷'}
                    <span className="text-xs">▼</span>
                  </button>
                  {themeMenuOpen && (
                    <div
                      onMouseLeave={() => setThemeMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-200 dark:border-gray-700">Normal</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'light' && layoutMode === 'normal' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>☀️</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'normal'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'normal' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>🌙</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-t border-b border-gray-200 dark:border-gray-700 mt-1">XVIDEOS</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'light' && layoutMode === 'xvideos' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'xvideos'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'xvideos' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>🎬</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-t border-b border-gray-200 dark:border-gray-700 mt-1">Soviético</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'light' && layoutMode === 'soviet' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>☭</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'soviet'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'soviet' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>☭</span>
                          <span>Escuro</span>
                        </button>
                        <div className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-t border-b border-gray-200 dark:border-gray-700 mt-1">Patriota</div>
                        <button
                          onClick={() => { setThemeAndLayout('light', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'light' && layoutMode === 'patriota' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => { setThemeAndLayout('dark', 'patriota'); setThemeMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2 ${theme === 'dark' && layoutMode === 'patriota' ? 'bg-blue-50 dark:bg-blue-900/30 font-bold' : ''}`}
                        >
                          <span>🇧🇷</span>
                          <span>Escuro</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <NotificationSystem />

                {/* Perfil / avatar e menu */}
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
                    <Avatar size="md" />
                  </button>
                  {menuOpen && (
                    <div
                      onMouseLeave={() => setMenuOpen(false)}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-600 rounded-xl shadow-lg z-50 transition-colors duration-200"
                    >
                      <div className="py-2">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setShowUserModal(true);
                              setMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            📋 Cadastrar vítima
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowProfileModal(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          👤 Meu perfil
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordModal(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          🔒 Alterar senha
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 font-black rounded-md border-2 border-black dark:border-gray-600 hover:bg-red-100 dark:hover:bg-gray-600 transition-colors duration-200 text-sm"
                >
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={`transition-colors duration-200 ${
        isXvideosMode
          ? 'bg-white border-b border-gray-200'
          : 'bg-white dark:bg-gray-800 shadow-md border-b-2 border-gray-300 dark:border-gray-700'
      }`}>
        <div className={`${isXvideosMode || isSovietMode || isPatriotaMode ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className={`flex items-center ${isXvideosMode || isSovietMode || isPatriotaMode ? 'space-x-6' : 'space-x-1'} ${isXvideosMode || isSovietMode || isPatriotaMode ? 'h-10' : 'py-2'}`}>
            <div className="flex flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={isXvideosMode ? (
                    `px-1 py-0 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'text-orange-600 font-bold border-b-2 border-orange-500'
                        : 'text-gray-600 hover:text-orange-500'
                    }`
                  ) : isSovietMode ? (
                    `soviet-nav-item px-2 py-1 ${
                      activeTab === tab.id
                        ? 'text-yellow-500 font-black border-b-2 border-yellow-500'
                        : ''
                    }`
                  ) : isPatriotaMode ? (
                    `patriota-nav-item px-2 py-1 ${
                      activeTab === tab.id
                        ? 'text-yellow-500 font-black border-b-2 border-yellow-500'
                        : ''
                    }`
                  ) : (
                    `px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-red-600 dark:bg-red-700 text-white shadow-lg transform scale-105 border-2 border-black dark:border-gray-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                    }`
                  )}
                >
                  {!isXvideosMode && !isSovietMode && !isPatriotaMode && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isXvideosMode || isSovietMode || isPatriotaMode ? 'py-4' : 'py-8'}`}>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-6 mt-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-bold mb-2">🐷 Hub Meinha Games</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Finanças, zoeira e humilhação pública, tudo num só lugar
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-600 mt-2">
            © 2024 - A vergonha continua
          </p>
        </div>
      </footer>
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full border-4 border-black dark:border-gray-600 shadow-2xl transition-colors duration-200">
            <UserRegistration
              onSuccess={() => setShowUserModal(false)}
              onCancel={() => setShowUserModal(false)}
            />
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full border-4 border-black dark:border-gray-600 shadow-2xl transition-colors duration-200">
            <ProfileEditForm
              onSuccess={() => setShowProfileModal(false)}
              onCancel={() => setShowProfileModal(false)}
            />
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-lg w-full border-4 border-black dark:border-gray-600 shadow-2xl transition-colors duration-200">
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
