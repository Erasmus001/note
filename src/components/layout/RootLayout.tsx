import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useNotes } from '../../hooks/useNotes';
import { useFolders } from '../../hooks/useFolders';
import { useSettings } from '../../hooks/useSettings';
import { Sidebar, OfflineBanner, FolderModal, DeleteConfirmModal, SettingsModal } from '..';
import { ViewMode, Folder } from '../../../types';

export const RootLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    notes,
    ownedNotes,
    sharedNotes,
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
  const { settings, setFontSize, setEditorWidth } = useSettings();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'appearance' | 'editor' | 'tags' | 'sync' | 'data'>('appearance');
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

  // Determine current view for Sidebar highlighting
  const currentView = React.useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '/notes') return { mode: ViewMode.All };
    if (path.startsWith('/starred')) return { mode: ViewMode.Starred };
    if (path.startsWith('/trash')) return { mode: ViewMode.Trash };
    if (path.startsWith('/shared')) return { mode: ViewMode.Shared };
    if (path.startsWith('/folders/')) return { mode: ViewMode.Folder, id: path.split('/')[2] };
    if (path.startsWith('/tags/')) return { mode: ViewMode.Tag, id: decodeURIComponent(path.split('/')[2]) };

    return { mode: ViewMode.All };
  }, [location.pathname]);

  // Folder management
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
    setFolderToDelete(folder);
  };

  const confirmDeleteFolder = () => {
    if (!folderToDelete) return;
    const notesInFolder = notes.filter((n) => n.folderId === folderToDelete.id);
    deleteFolder(folderToDelete.id, notesInFolder.map((n) => n.id));

    if (currentView.mode === ViewMode.Folder && currentView.id === folderToDelete.id) {
      navigate('/notes');
    }
    setFolderToDelete(null);
  };

  return (
    <div className="flex h-screen w-full bg-white text-zinc-900 overflow-hidden relative font-sans">
      <div className="absolute top-0 left-0 right-0 z-50">
        <OfflineBanner />
      </div>

      <Sidebar
        folders={folders}
        allTags={allTags}
        tagUsage={tagUsage}
        currentView={currentView}
        isCollapsed={isSidebarCollapsed}
        onSetCollapsed={setIsSidebarCollapsed}
        onSetView={(view) => {
          switch (view.mode) {
            case ViewMode.All: navigate('/notes'); break;
            case ViewMode.Starred: navigate('/starred'); break;
            case ViewMode.Trash: navigate('/trash'); break;
            case ViewMode.Shared: navigate('/shared'); break;
            case ViewMode.Folder: navigate(`/folders/${view.id}`); break;
            case ViewMode.Tag: navigate(`/tags/${view.id}`); break;
          }
        }}
        onOpenSettings={(tab) => {
          setSettingsTab(tab || 'appearance');
          setShowSettings(true);
        }}
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
        notes, ownedNotes, sharedNotes, folders, settings,
        createNote, updateNote,
        toggleStar, togglePin, moveToTrash,
        restoreNote, deletePermanently, emptyTrash,
        addAttachment, resizeAttachment,
        renameGlobalTag, deleteGlobalTag,
        // UI Props
        showSettings, setShowSettings,
        setFontSize, setEditorWidth
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

      <DeleteConfirmModal
        isOpen={!!folderToDelete}
        title="Delete Folder"
        message={`Are you sure you want to delete "${folderToDelete?.name}"? All ${notes.filter((n) => n.folderId === folderToDelete?.id).length} notes in this folder will be moved to trash.`}
        confirmLabel="Delete Folder"
        onConfirm={confirmDeleteFolder}
        onCancel={() => setFolderToDelete(null)}
      />

      <SettingsModal
        isOpen={showSettings}
        activeTab={settingsTab}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onTabChange={setSettingsTab}
        onSetFontSize={setFontSize}
        onSetEditorWidth={setEditorWidth}
      />
    </div>
  );
};
