import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const colors = useMemo(
    () =>
      isDark
        ? {
            background: '#121212',
            text: '#FFFFFF',
            subText: '#BBBBBB',
            border: '#333333',
            boxBackground: '#1E1E1E',
            accent: '#4A90E2',
          }
        : {
            background: '#FFFFFF',
            text: '#000000',
            subText: '#666666',
            border: '#DDDDDD',
            boxBackground: '#F8F8F8',
            accent: '#007AFF',
          },
    [isDark]
  );

  return (
    <ThemeContext.Provider value={{ scheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
