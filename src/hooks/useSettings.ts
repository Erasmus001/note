import { useState, useEffect } from "react";
import { AppSettings } from "../../types";
import { APP_ID } from "../../constants";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  fontSize: "base",
  editorWidth: "standard",
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-settings`);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Apply theme on settings change
  useEffect(() => {
    try {
      localStorage.setItem(`${APP_ID}-settings`, JSON.stringify(settings));
    } catch (e) {}

    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  // Apply theme immediately on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`${APP_ID}-settings`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } catch (e) {}
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setSettings((s) => ({
      ...s,
      theme: s.theme === "light" ? "dark" : "light",
    }));
  };

  const setFontSize = (fontSize: AppSettings["fontSize"]) => {
    setSettings((s) => ({ ...s, fontSize }));
  };

  const setEditorWidth = (editorWidth: AppSettings["editorWidth"]) => {
    setSettings((s) => ({ ...s, editorWidth }));
  };

  return {
    settings,
    setSettings,
    toggleTheme,
    setFontSize,
    setEditorWidth,
  };
};
