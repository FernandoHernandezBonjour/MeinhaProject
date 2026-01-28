'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';
type LayoutMode = 'clean' | 'normal' | 'xvideos' | 'soviet' | 'patriota';
type Theme = ThemeMode | 'clean-light' | 'clean-dark' | 'xvideos-light' | 'xvideos-dark' | 'soviet-light' | 'soviet-dark' | 'patriota-light' | 'patriota-dark';

interface ThemeContextType {
  theme: ThemeMode;
  layoutMode: LayoutMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setThemeAndLayout: (theme: ThemeMode, layoutMode: LayoutMode) => void;
  toggleXvideosMode: () => void;
  toggleSovietMode: () => void;
  togglePatriotaMode: () => void;
  isXvideosMode: boolean;
  isSovietMode: boolean;
  isPatriotaMode: boolean;
  isCleanMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('clean');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verificar se há um tema salvo no localStorage ou usar preferência do sistema
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const savedLayoutMode = localStorage.getItem('layoutMode') as LayoutMode | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    // Default to clean mode if nothing is saved
    const initialTheme = savedTheme || systemPreference;
    const initialLayoutMode = savedLayoutMode || 'clean';

    setTheme(initialTheme);
    setLayoutMode(initialLayoutMode);
    applyTheme(initialTheme, initialLayoutMode);
  }, []);

  const applyTheme = (newTheme: ThemeMode, newLayoutMode: LayoutMode) => {
    const root = window.document.documentElement;
    // Remover todas as classes de tema
    root.classList.remove('light', 'dark', 'clean-light', 'clean-dark', 'xvideos-light', 'xvideos-dark', 'soviet-light', 'soviet-dark', 'patriota-light', 'patriota-dark', 'clean-mode', 'xvideos-mode', 'soviet-mode', 'patriota-mode', 'normal-mode');

    if (newLayoutMode === 'xvideos') {
      // No modo XVIDEOS, usar tema específico
      const xvideosTheme = newTheme === 'dark' ? 'xvideos-dark' : 'xvideos-light';
      root.classList.add(xvideosTheme, 'xvideos-mode');
    } else if (newLayoutMode === 'soviet') {
      // No modo SOVIET, usar tema específico
      const sovietTheme = newTheme === 'dark' ? 'soviet-dark' : 'soviet-light';
      root.classList.add(sovietTheme, 'soviet-mode');
    } else if (newLayoutMode === 'patriota') {
      // No modo PATRIOTA, usar tema específico
      const patriotaTheme = newTheme === 'dark' ? 'patriota-dark' : 'patriota-light';
      root.classList.add(patriotaTheme, 'patriota-mode');
    } else if (newLayoutMode === 'clean') {
      const cleanTheme = newTheme === 'dark' ? 'clean-dark' : 'clean-light';
      root.classList.add(cleanTheme, 'clean-mode');
    } else {
      // Normal / Legacy mode
      root.classList.add(newTheme, 'normal-mode');
    }

    localStorage.setItem('theme', newTheme);
    localStorage.setItem('layoutMode', newLayoutMode);
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme, layoutMode);
  };

  const handleSetThemeAndLayout = (newTheme: ThemeMode, newLayoutMode: LayoutMode) => {
    setTheme(newTheme);
    setLayoutMode(newLayoutMode);
    applyTheme(newTheme, newLayoutMode);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    handleSetTheme(newTheme);
  };

  const toggleXvideosMode = () => {
    // Se estiver em modo soviet, desativar e ir para clean (padrao)
    // Se estiver em clean/normal, ativar xvideos
    // Se estiver em xvideos, voltar para clean
    let newLayoutMode: LayoutMode;
    if (layoutMode === 'xvideos') {
      newLayoutMode = 'clean';
    } else {
      newLayoutMode = 'xvideos';
    }
    setLayoutMode(newLayoutMode);
    applyTheme(theme, newLayoutMode);
  };

  const toggleSovietMode = () => {
    let newLayoutMode: LayoutMode;
    if (layoutMode === 'soviet') {
      newLayoutMode = 'clean';
    } else {
      newLayoutMode = 'soviet';
    }
    setLayoutMode(newLayoutMode);
    applyTheme(theme, newLayoutMode);
  };

  const togglePatriotaMode = () => {
    let newLayoutMode: LayoutMode;
    if (layoutMode === 'patriota') {
      newLayoutMode = 'clean';
    } else {
      newLayoutMode = 'patriota';
    }
    setLayoutMode(newLayoutMode);
    applyTheme(theme, newLayoutMode);
  };

  // Evitar flash de conteúdo incorreto antes do mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      layoutMode,
      toggleTheme,
      setTheme: handleSetTheme,
      setThemeAndLayout: handleSetThemeAndLayout,
      toggleXvideosMode,
      toggleSovietMode,
      togglePatriotaMode,
      isCleanMode: layoutMode === 'clean',
      isXvideosMode: layoutMode === 'xvideos',
      isSovietMode: layoutMode === 'soviet',
      isPatriotaMode: layoutMode === 'patriota'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

