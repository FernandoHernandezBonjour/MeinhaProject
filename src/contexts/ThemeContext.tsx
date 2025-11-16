'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';
type LayoutMode = 'normal' | 'xvideos';
type Theme = ThemeMode | 'xvideos-light' | 'xvideos-dark';

interface ThemeContextType {
  theme: ThemeMode;
  layoutMode: LayoutMode;
  toggleTheme: () => void;
  toggleXvideosMode: () => void;
  isXvideosMode: boolean;
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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('normal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verificar se há um tema salvo no localStorage ou usar preferência do sistema
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    const savedLayoutMode = localStorage.getItem('layoutMode') as LayoutMode | null;
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    const initialTheme = savedTheme || systemPreference;
    const initialLayoutMode = savedLayoutMode || 'normal';
    
    setTheme(initialTheme);
    setLayoutMode(initialLayoutMode);
    applyTheme(initialTheme, initialLayoutMode);
  }, []);

  const applyTheme = (newTheme: ThemeMode, newLayoutMode: LayoutMode) => {
    const root = window.document.documentElement;
    // Remover todas as classes de tema
    root.classList.remove('light', 'dark', 'xvideos-light', 'xvideos-dark', 'xvideos-mode', 'normal-mode');
    
    if (newLayoutMode === 'xvideos') {
      // No modo XVIDEOS, usar tema específico
      const xvideosTheme = newTheme === 'dark' ? 'xvideos-dark' : 'xvideos-light';
      root.classList.add(xvideosTheme, 'xvideos-mode');
    } else {
      root.classList.add(newTheme, 'normal-mode');
    }
    
    localStorage.setItem('theme', newTheme);
    localStorage.setItem('layoutMode', newLayoutMode);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme, layoutMode);
  };

  const toggleXvideosMode = () => {
    const newLayoutMode = layoutMode === 'normal' ? 'xvideos' : 'normal';
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
      toggleXvideosMode,
      isXvideosMode: layoutMode === 'xvideos'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

