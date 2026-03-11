import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const THEME_COLORS = [
  { name: 'Xanh dương', hex: '#3b82f6', class: 'bg-blue-600' },
  { name: 'Tím', hex: '#8b5cf6', class: 'bg-violet-600' },
  { name: 'Xanh lá', hex: '#10b981', class: 'bg-emerald-600' },
  { name: 'Hồng', hex: '#ec4899', class: 'bg-pink-600' },
  { name: 'Cam vàng', hex: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Cam', hex: '#f97316', class: 'bg-orange-600' },
  { name: 'Xanh lơ', hex: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Xám', hex: '#475569', class: 'bg-slate-600' },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || 'Xanh dương';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle primary color change
  useEffect(() => {
    const root = window.document.documentElement;
    const colorConfig = THEME_COLORS.find(c => c.name === primaryColor) || THEME_COLORS[0];
    root.style.setProperty('--primary', colorConfig.hex);
    root.style.setProperty('--ring', colorConfig.hex);
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  // Listen for system changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
