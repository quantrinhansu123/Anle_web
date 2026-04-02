import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export const THEME_COLORS = [
  { name: 'Blue', hex: '#3b82f6', class: 'bg-blue-600' },
  { name: 'Purple', hex: '#8b5cf6', class: 'bg-violet-600' },
  { name: 'Green', hex: '#10b981', class: 'bg-emerald-600' },
  { name: 'Pink', hex: '#ec4899', class: 'bg-pink-600' },
  { name: 'Amber', hex: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Orange', hex: '#f97316', class: 'bg-orange-600' },
  { name: 'Cyan', hex: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Slate', hex: '#475569', class: 'bg-slate-600' },
];

export const THEME_FONTS = [
  { id: 'Inter', name: 'Inter', description: 'Modern, neutral' },
  { id: 'Be Vietnam Pro', name: 'Be Vietnam Pro', description: 'Vietnamese optimized' },
  { id: 'Lexend', name: 'Lexend', description: 'Readable, airy' },
  { id: 'Nunito', name: 'Nunito', description: 'Soft, friendly' },
  { id: 'Source Sans 3', name: 'Source Sans 3', description: 'Professional' },
  { id: 'Merriweather', name: 'Merriweather', description: 'Classic Serif' },
];

export const THEME_SIZES = [
  { id: 'small', name: 'Small', description: 'Base 14px', size: '14px' },
  { id: 'medium', name: 'Medium', description: 'Base 16px', size: '16px' },
  { id: 'large', name: 'Large', description: 'Base 18px', size: '18px' },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  font: string;
  setFont: (font: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || 'Blue';
  });

  const [font, setFont] = useState<string>(() => {
    return localStorage.getItem('font') || 'Inter';
  });

  const [fontSize, setFontSize] = useState<string>(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });

  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('userAvatar') || '';
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

  // Handle font change
  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--font-sans', `'${font}', sans-serif`);
    localStorage.setItem('font', font);
  }, [font]);

  // Handle font size change
  useEffect(() => {
    const root = window.document.documentElement;
    const sizeConfig = THEME_SIZES.find(s => s.id === fontSize) || THEME_SIZES[1];
    root.style.fontSize = sizeConfig.size;
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Handle avatar change
  useEffect(() => {
    if (avatar) {
      localStorage.setItem('userAvatar', avatar);
    }
  }, [avatar]);

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
    <ThemeContext.Provider value={{
      theme, setTheme,
      primaryColor, setPrimaryColor,
      font, setFont,
      fontSize, setFontSize,
      avatar, setAvatar
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
