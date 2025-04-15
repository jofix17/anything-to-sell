import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Available themes
export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "default" | "blue" | "green" | "purple" | "orange";

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  isDarkMode: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
  toggleMode: () => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Constants
const THEME_MODE_KEY = "theme_mode";
const COLOR_SCHEME_KEY = "color_scheme";

// Props for the provider component
interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultColorScheme?: ColorScheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "system",
  defaultColorScheme = "default",
}) => {
  // Initialize state from localStorage if available
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY);
    return (savedMode as ThemeMode) || defaultMode;
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const savedColorScheme = localStorage.getItem(COLOR_SCHEME_KEY);
    return (savedColorScheme as ColorScheme) || defaultColorScheme;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (mode === "light") return false;
    if (mode === "dark") return true;
    // If mode is 'system', check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Listen for system theme changes if mode is set to 'system'
  useEffect(() => {
    if (mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Initial check
    setIsDarkMode(mediaQuery.matches);
    
    // Set up listener for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [mode]);

  // Update isDarkMode when mode changes
  useEffect(() => {
    if (mode === "light") {
      setIsDarkMode(false);
    } else if (mode === "dark") {
      setIsDarkMode(true);
    } else {
      // If mode is 'system', check system preference
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, [mode]);

  // Apply theme to the document when isDarkMode or colorScheme changes
  useEffect(() => {
    // Update document classes for dark/light mode
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    // Remove all color scheme classes first
    document.documentElement.classList.remove(
      "theme-default",
      "theme-blue",
      "theme-green",
      "theme-purple",
      "theme-orange"
    );

    // Add the current color scheme class
    document.documentElement.classList.add(`theme-${colorScheme}`);
  }, [isDarkMode, colorScheme]);

  // Set theme mode and save to localStorage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  // Set color scheme and save to localStorage
  const setColorScheme = (newColorScheme: ColorScheme) => {
    setColorSchemeState(newColorScheme);
    localStorage.setItem(COLOR_SCHEME_KEY, newColorScheme);
  };

  // Toggle between light and dark mode
  const toggleMode = () => {
    if (mode === "system") {
      // If currently system, toggle to explicit light/dark based on current appearance
      setMode(isDarkMode ? "light" : "dark");
    } else if (mode === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colorScheme,
        isDarkMode,
        setMode,
        setColorScheme,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};