import { useState, useEffect } from "react";
import { Folder } from "../../types";
import { INITIAL_FOLDERS, APP_ID } from "../../constants";

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-folders`);
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch (e) {
      return INITIAL_FOLDERS;
    }
  });

  // Persist folders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${APP_ID}-folders`, JSON.stringify(folders));
    } catch (e) {}
  }, [folders]);

  const addFolder = (name: string, icon: string = "📁") => {
    const newFolder: Folder = {
      id: `f-${Date.now()}`,
      name: name.trim(),
      icon,
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  return {
    folders,
    setFolders,
    addFolder,
    deleteFolder,
    updateFolder,
  };
};
