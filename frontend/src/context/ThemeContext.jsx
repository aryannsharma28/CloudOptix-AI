import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudoptix_theme");
      if (saved && ["light", "dark", "system"].includes(saved)) {
        return saved;
      }
      // If user system preference is dark, default to dark, else dark for modern FinOps
      return "dark";
    } catch {
      return "dark";
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const applyTheme = () => {
      let active = theme;
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        active = prefersDark ? "dark" : "light";
      }
      setResolvedTheme(active);
      document.documentElement.setAttribute("data-theme", active);
      document.body.setAttribute("data-theme", active);
      if (active === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("dark");
      }
    };

    applyTheme();

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("cloudoptix_theme", newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark: resolvedTheme === "dark",
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
