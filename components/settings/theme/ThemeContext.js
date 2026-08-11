// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 📱 시스템 다크모드 감지
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    setIsDark(systemScheme === "dark");
  }, [systemScheme]);

  const colors = isDark
    ? {
        background: "#121212",
        text: "#FFFFFF",
        boxBackground: "#1E1E1E",
        border: "#333333",
        subText: "#AAAAAA",
      }
    : {
        background: "#FFFFFF",
        text: "#000000",
        boxBackground: "#F5F5F5",
        border: "#E0E0E0",
        subText: "#666666",
      };

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
