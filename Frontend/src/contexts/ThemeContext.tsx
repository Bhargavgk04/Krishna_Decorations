import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    localStorage.setItem('theme', 'dark');
  }, []);

  const toggleTheme = () => {
    // Dark mode only – no-op toggle
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode: true, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};