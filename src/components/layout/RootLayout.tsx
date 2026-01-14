import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import { useSettings } from '../../hooks/useSettings';
import { Sidebar, OfflineBanner, FolderModal } from '..';
import { ViewMode, Folder } from '../../../types';

export const RootLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    notes,
    tagUsage,
    allTags,
    createNote,
    updateNote,
    toggleStar,
    togglePin,
    moveToTrash,
    restoreNote,
    deletePermanently,
    emptyTrash,
    addAttachment,
    resizeAttachment,
    renameGlobalTag,
    deleteGlobalTag
  } = useNotes();

  const { folders, addFolder, deleteFolder, updateFolder } = useFolders();
  const { settings, toggleTheme, setFontSize, setEditorWidth } = useSettings();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [showSettings, setShowSettings] = useState(false); // Global settings modal state if needed here

  // Determine current view for Sidebar highlighting
  const currentView = React.useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '/notes') return { mode: ViewMode.All };
    if (path.startsWith('/starred')) return { mode: ViewMode.Starred };
    if (path.startsWith('/trash')) return { mode: ViewMode.Trash };
    if (path.startsWith('/folders/')) return { mode: ViewMode.Folder, id: path.split('/')[2] };
    if (path.startsWith('/tags/')) return { mode: ViewMode.Tag, id: decodeURIComponent(path.split('/')[2]) };

    return { mode: ViewMode.All };
  }, [location.pathname]);

  // Folder management (Moved from App.tsx)
  const handleSaveFolder = () => {
    if (newFolderName.trim()) {
      if (editingFolder) {
        updateFolder(editingFolder.id, {
          name: newFolderName.trim(),
          icon: newFolderIcon || "📁",
        });
      } else {
        const folder = addFolder(newFolderName.trim(), newFolderIcon || "📁");
        if (folder) navigate(`/folders/${folder.id}`);
      }
      setNewFolderName("");
      setEditingFolder(null);
      setShowFolderModal(false);
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    const notesInFolder = notes.filter((n) => n.folderId === folder.id);

    deleteFolder(folder.id, notesInFolder.map((n) => n.id));

    if (currentView.mode === ViewMode.Folder && currentView.id === folder.id) {
      navigate('/notes');
    }
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-hidden relative font-sans">
      <div className="absolute top-0 left-0 right-0 z-50">
        <OfflineBanner />
      </div>

      <Sidebar
        folders={folders}
        allTags={allTags}
        tagUsage={tagUsage}
        currentView={currentView}
        settings={settings}
        isCollapsed={isSidebarCollapsed}
        onSetCollapsed={setIsSidebarCollapsed}
        onSetView={(view) => {
          // Translation from ViewMode to URL
          switch (view.mode) {
            case ViewMode.All: navigate('/notes'); break;
            case ViewMode.Starred: navigate('/starred'); break;
            case ViewMode.Trash: navigate('/trash'); break;
            case ViewMode.Folder: navigate(`/folders/${view.id}`); break;
            case ViewMode.Tag: navigate(`/tags/${view.id}`); break;
          }
        }}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
        onCreateFolder={() => {
          setEditingFolder(null);
          setNewFolderName("");
          setShowFolderModal(true);
        }}
        onRenameFolder={(f) => {
          setEditingFolder(f);
          setNewFolderName(f.name);
          setNewFolderIcon(f.icon);
          setShowFolderModal(true);
        }}
        onDeleteFolder={handleDeleteFolder}
      />

      <Outlet context={{
        notes, folders, settings,
        createNote, updateNote,
        toggleStar, togglePin, moveToTrash,
        restoreNote, deletePermanently, emptyTrash,
        addAttachment, resizeAttachment,
        renameGlobalTag, deleteGlobalTag,
        // UI Props
        showSettings, setShowSettings,
        toggleTheme, setFontSize, setEditorWidth
      }} />

      <FolderModal
        isOpen={showFolderModal}
        folderName={newFolderName}
        folderIcon={newFolderIcon}
        onFolderNameChange={setNewFolderName}
        onFolderIconChange={setNewFolderIcon}
        onSave={handleSaveFolder}
        onClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
          setNewFolderName("");
        }}
        isEditing={!!editingFolder}
      />
    </div>
  );
};
