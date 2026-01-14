import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Star,
  Trash2,
  X,
  CheckCircle2,
  Eye,
  Edit3,
  Paperclip,
  Link as LinkIcon,
  RefreshCw,
  AlertTriangle,
  Type,
  Monitor,
  Database,
  Cloud,
  Upload,
  FileText,
  Plus,
  Layout,
  Zap,
  Lock,
  Globe,
  Sun,
  Moon,
  Tag,
  Hash,
  Pencil,
  Download,
  UserPlus,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/clerk-react";

// Import types and constants
import { Attachment, Folder, ViewMode } from "./types";
import { APP_ID } from "./constants";

// Import extracted hooks
import { useNotes } from "./src/hooks/useNotes";
import { useFolders } from "./src/hooks/useFolders";
import { useSettings } from "./src/hooks/useSettings";
import { useMigration } from "./src/hooks/useMigration";

// Import extracted components
import {
  Sidebar,
  NoteExplorer,
  BlockEditor,
  NoteReadingView,
  ImagePreviewModal,
  FolderModal,
  UrlModal,
  BlockEditorRef,
  OfflineBanner,
} from "./src/components";

// Import utilities
import { getYouTubeId, getTweetId, processFiles } from "./src/utils";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-zinc-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="z-10 text-center space-y-8 max-w-4xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center rotate-12 shadow-2xl">
            <Layout className="text-zinc-950" size={28} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic">
            JAM
          </h1>
        </div>

        <h2 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-b from-white to-zinc-500">
          Capture thoughts at the speed of light.
        </h2>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          A minimalist note-taking experience with block-based editing, instant
          cloud sync, and iron-clad security.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-zinc-950 rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group">
              Get Started{" "}
              <Zap
                size={20}
                className="group-hover:fill-current transition-all"
              />
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full sm:w-auto px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 border border-zinc-800 transition-all flex items-center justify-center gap-2">
              Sign Up <UserPlus size={20} />
            </button>
          </SignUpButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
          {[
            {
              icon: <Lock className="text-blue-500" />,
              title: "Secure",
              desc: "Private encryption with Clerk Auth",
            },
            {
              icon: <Cloud className="text-purple-500" />,
              title: "Cloud",
              desc: "Real-time sync with InstantDB",
            },
            {
              icon: <Globe className="text-green-500" />,
              title: "Anywhere",
              desc: "Access notes from any device",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl text-left hover:border-zinc-700 transition-all"
            >
              <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center mb-4 border border-zinc-700">
                {feature.icon}
              </div>
              <h3 className="font-bold text-xl mb-1">{feature.title}</h3>
              <p className="text-zinc-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { isLoaded: authLoaded } = useUser();
  const { isMigrating } = useMigration();

  const [currentView, setCurrentView] = useState<{
    mode: ViewMode;
    id?: string;
  }>({ mode: ViewMode.All });
  const [searchQuery, setSearchQuery] = useState("");

  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    filteredNotes,
    saveStatus,
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
    deleteGlobalTag,
    isLoading: notesLoading,
  } = useNotes(currentView, searchQuery);

  const {
    folders,
    addFolder,
    deleteFolder,
    updateFolder,
    isLoading: foldersLoading,
  } = useFolders();

  const {
    settings,
    toggleTheme,
    setFontSize,
    setEditorWidth,
    updateSettings,
    isLoading: settingsLoading,
  } = useSettings();

  const [selectedPreviewImage, setSelectedPreviewImage] =
    useState<Attachment | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "appearance" | "editor" | "tags" | "sync" | "data"
  >("appearance");
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const blockEditorRef = useRef<BlockEditorRef>(null);

  const fontSizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg" }[
    settings.fontSize
  ];
  const editorWidthClass = {
    narrow: "max-w-2xl",
    standard: "max-w-4xl",
    full: "max-w-full",
  }[settings.editorWidth];

  const handleAddTag = useCallback(() => {
    if (newTagValue.trim() && activeNote && !activeNote.isTrashed) {
      const tag = newTagValue.trim().toLowerCase();
      if (!activeNote.tags.includes(tag)) {
        updateNote(activeNote.id, { tags: [...activeNote.tags, tag] });
      }
    }
    setNewTagValue("");
    setIsAddingTag(false);
  }, [newTagValue, activeNote, updateNote]);

  const handleAddUrl = () => {
    if (!activeNote || !newUrlValue.trim() || activeNote.isTrashed) return;
    let urlString = newUrlValue.trim();
    if (!/^https?:\/\//i.test(urlString)) urlString = `https://${urlString}`;

    const id = `att-${Date.now()}`;
    let name = "Web Link";
    const ytId = getYouTubeId(urlString);
    const twId = getTweetId(urlString);

    if (ytId) name = "YouTube Video";
    else if (twId) name = "Tweet";
    else {
      try {
        const urlObj = new URL(urlString);
        const pathSegments = urlObj.pathname.split("/").filter(Boolean);
        if (pathSegments.length > 0) {
          name = pathSegments[pathSegments.length - 1]
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
        } else {
          name = urlObj.hostname;
        }
      } catch (e) {
        name = urlString;
      }
    }

    const attachment: Attachment = { id, name, type: "url", url: urlString };
    updateNote(activeNote.id, {
      attachments: [...activeNote.attachments, attachment],
    });

    setTimeout(() => {
      if (blockEditorRef.current) {
        blockEditorRef.current.insertContent(`\n[Link: ${name}](${id})\n`);
      }
    }, 10);

    setNewUrlValue("");
    setShowUrlModal(false);
  };

  const handleSaveFolder = useCallback(() => {
    if (newFolderName.trim()) {
      if (editingFolder) {
        updateFolder(editingFolder.id, {
          name: newFolderName.trim(),
          icon: newFolderIcon || "📁",
        });
      } else {
        const folder = addFolder(newFolderName.trim(), newFolderIcon || "📁");
        if (folder) setCurrentView({ mode: ViewMode.Folder, id: folder.id });
      }
      setNewFolderName("");
      setEditingFolder(null);
      setShowFolderModal(false);
    }
  }, [newFolderName, newFolderIcon, addFolder, updateFolder, editingFolder]);

  const handleRenameFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderIcon(folder.icon);
    setShowFolderModal(true);
  };

  const handleDeleteFolder = (folder: Folder) => {
    const notesInFolder = notes.filter((n) => n.folderId === folder.id);
    deleteFolder(
      folder.id,
      notesInFolder.map((n) => n.id),
    );
    if (currentView.mode === ViewMode.Folder && currentView.id === folder.id) {
      setCurrentView({ mode: ViewMode.All });
    }
  };

  const handleExportData = () => {
    const data = {
      notes,
      folders,
      settings,
      exportDate: Date.now(),
      appId: APP_ID,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jam-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (activeNote) {
      const isNew =
        Date.now() - activeNote.createdAt < 1000 && activeNote.content === "";
      if (isNew) setIsPreviewMode(false);
    }
  }, [activeNoteId]);

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) tagInputRef.current.focus();
  }, [isAddingTag]);

  if (!authLoaded)
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center text-white font-bold animate-pulse">
        Initializing...
      </div>
    );

  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>
      <SignedIn>
        <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-hidden relative font-sans">
          <div className="absolute top-0 left-0 right-0 z-[60]">
            <OfflineBanner />
          </div>

          {isMigrating && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto animate-bounce text-blue-500">
                  <Cloud size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Syncing Local Notes
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed text-balance">
                  We're moving your local notes to your secure cloud account.
                  Hang tight!
                </p>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-[loading_1.5s_infinite_ease-in-out]"></div>
                </div>
              </div>
            </div>
          )}

          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[600px] flex overflow-hidden rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 shrink-0">
                  <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 ml-2">
                    Settings
                  </h2>
                  <nav className="space-y-1">
                    {["appearance", "editor", "tags", "sync", "data"].map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveSettingsTab(tab as any)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === tab ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"}`}
                        >
                          {tab === "appearance" && <Monitor size={16} />}
                          {tab === "editor" && <Type size={16} />}
                          {tab === "tags" && <Tag size={16} />}
                          {tab === "sync" && <Cloud size={16} />}
                          {tab === "data" && <Database size={16} />}
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ),
                    )}
                  </nav>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-bold capitalize">
                      {activeSettingsTab} Settings
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8">
                    {activeSettingsTab === "appearance" && (
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                            Theme Mode
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => toggleTheme()}
                              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === "light" ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800" : "border-zinc-100 dark:border-zinc-800"}`}
                            >
                              <Sun
                                size={24}
                                className={
                                  settings.theme === "light"
                                    ? "text-amber-500"
                                    : "text-zinc-400"
                                }
                              />
                              <span className="text-xs font-bold">
                                Light Mode
                              </span>
                            </button>
                            <button
                              onClick={() => toggleTheme()}
                              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === "dark" ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800" : "border-zinc-100 dark:border-zinc-800"}`}
                            >
                              <Moon
                                size={24}
                                className={
                                  settings.theme === "dark"
                                    ? "text-blue-400"
                                    : "text-zinc-400"
                                }
                              />
                              <span className="text-xs font-bold">
                                Dark Mode
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeSettingsTab === "editor" && (
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                            Font Size
                          </h4>
                          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                            {(["sm", "base", "lg"] as const).map((size) => (
                              <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${settings.fontSize === size ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}
                              >
                                {size === "sm"
                                  ? "Small"
                                  : size === "base"
                                    ? "Default"
                                    : "Large"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
                            Editor Width
                          </h4>
                          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                            {(["narrow", "standard", "full"] as const).map(
                              (width) => (
                                <button
                                  key={width}
                                  onClick={() => setEditorWidth(width)}
                                  className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${settings.editorWidth === width ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500"}`}
                                >
                                  {width}
                                </button>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {activeSettingsTab === "tags" && (
                      <div className="space-y-4">
                        {allTags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border group"
                          >
                            <div className="flex items-center gap-3">
                              <Hash size={16} />
                              <span className="text-sm font-bold">{tag}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const newTag = prompt("Rename tag:", tag);
                                  if (newTag) renameGlobalTag(tag, newTag);
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => deleteGlobalTag(tag)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeSettingsTab === "sync" && (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                          <Cloud className="text-blue-500" />
                          <div>
                            <h4 className="text-sm font-bold">
                              InstantDB Cloud
                            </h4>
                            <p className="text-xs text-blue-600">
                              Your notes are automatically synced to the cloud.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeSettingsTab === "data" && (
                      <div className="space-y-4">
                        <button
                          onClick={handleExportData}
                          className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                        >
                          <Download size={16} /> Export Backup
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPreviewImage && (
            <ImagePreviewModal
              image={selectedPreviewImage}
              onClose={() => setSelectedPreviewImage(null)}
            />
          )}

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

          <UrlModal
            isOpen={showUrlModal}
            urlValue={newUrlValue}
            onUrlChange={setNewUrlValue}
            onAdd={handleAddUrl}
            onClose={() => setShowUrlModal(false)}
          />

          <Sidebar
            folders={folders}
            allTags={allTags}
            tagUsage={tagUsage}
            currentView={currentView}
            settings={settings}
            isCollapsed={isSidebarCollapsed}
            onSetCollapsed={setIsSidebarCollapsed}
            onSetView={(view) => {
              setCurrentView(view);
              setShowSettings(false);
            }}
            onToggleTheme={toggleTheme}
            onOpenSettings={(tab) => {
              setShowSettings(true);
              if (tab) setActiveSettingsTab(tab);
            }}
            onCreateFolder={() => {
              setEditingFolder(null);
              setNewFolderName("");
              setShowFolderModal(true);
            }}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />

          <NoteExplorer
            notes={filteredNotes}
            folders={folders}
            currentView={currentView}
            activeNoteId={activeNoteId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={(id) => {
              setActiveNoteId(id);
              setShowSettings(false);
            }}
            onCreateNote={() => {
              const note = createNote(
                currentView.mode === ViewMode.Folder
                  ? currentView.id
                  : undefined,
              );
              if (note) setActiveNoteId(note.id);
            }}
            onEmptyTrash={emptyTrash}
          />

          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
            {activeNote ? (
              <>
                {activeNote.isTrashed && (
                  <div className="bg-zinc-100 dark:bg-zinc-900 border-b px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-zinc-500 text-sm">
                      <AlertTriangle className="text-amber-500" size={18} />
                      <span>This note is in the trash.</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => restoreNote(activeNote.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 text-xs font-bold rounded-lg border text-green-600"
                      >
                        <RefreshCw size={14} /> Restore
                      </button>
                      <button
                        onClick={() => deletePermanently(activeNote.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-xs font-bold rounded-lg border text-red-600"
                      >
                        <Trash2 size={14} /> Delete Forever
                      </button>
                    </div>
                  </div>
                )}

                <div className="h-14 border-b flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                    <span>
                      {activeNote.folderId
                        ? folders.find((f) => f.id === activeNote.folderId)
                          ?.name
                        : "Drafts"}
                    </span>
                    <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                    {saveStatus === "saving" && (
                      <div className="animate-pulse">Saving...</div>
                    )}
                    {saveStatus === "saved" && (
                      <div className="text-green-500 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Saved
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!activeNote.isTrashed && (
                      <>
                        <button
                          onClick={() => toggleStar(activeNote.id)}
                          className={`p-2 rounded-lg ${activeNote.isStarred ? "text-yellow-500" : "text-zinc-400"}`}
                        >
                          <Star
                            size={18}
                            fill={
                              activeNote.isStarred ? "currentColor" : "none"
                            }
                          />
                        </button>
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
                      </>
                    )}
                    <button
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${isPreviewMode ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
                    >
                      {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                      {isPreviewMode ? "Edit" : "Read Mode"}
                    </button>
                    {!activeNote.isTrashed && (
                      <button
                        onClick={() => moveToTrash(activeNote.id)}
                        className="p-2 hover:text-red-500 text-zinc-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 relative">
                  <div
                    className={`mx-auto ${editorWidthClass} space-y-8 pb-32`}
                  >
                    {!isPreviewMode ? (
                      <>
                        <input
                          type="text"
                          value={activeNote.title}
                          onChange={(e) =>
                            updateNote(activeNote.id, { title: e.target.value })
                          }
                          disabled={activeNote.isTrashed}
                          placeholder="Note Title..."
                          className="w-full text-4xl md:text-5xl font-extrabold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                        />
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 dark:border-zinc-800 pr-4">
                            {activeNote.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-full flex items-center gap-1 group/tag"
                              >
                                #{t}
                                {!activeNote.isTrashed && (
                                  <button
                                    onClick={() =>
                                      updateNote(activeNote.id, {
                                        tags: activeNote.tags.filter(
                                          (tag) => tag !== t,
                                        ),
                                      })
                                    }
                                    className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </span>
                            ))}
                            {!activeNote.isTrashed &&
                              (isAddingTag ? (
                                <input
                                  ref={tagInputRef}
                                  type="text"
                                  value={newTagValue}
                                  onChange={(e) =>
                                    setNewTagValue(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleAddTag()
                                  }
                                  onBlur={handleAddTag}
                                  placeholder="..."
                                  className="px-2 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none w-16 text-[10px]"
                                />
                              ) : (
                                <button
                                  onClick={() => setIsAddingTag(true)}
                                  className="px-2 py-0.5 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[10px] rounded-full"
                                >
                                  <Plus size={10} /> Tag
                                </button>
                              ))}
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() =>
                                !activeNote.isTrashed &&
                                fileInputRef.current?.click()
                              }
                              className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                            >
                              <Paperclip size={14} /> Add File
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0 && blockEditorRef.current)
                                  blockEditorRef.current.insertFiles(files);
                                e.target.value = "";
                              }}
                            />
                            <button
                              onClick={() =>
                                !activeNote.isTrashed && setShowUrlModal(true)
                              }
                              className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                            >
                              <LinkIcon size={14} /> Web Link
                            </button>
                          </div>
                        </div>
                        <BlockEditor
                          ref={blockEditorRef}
                          content={activeNote.content}
                          attachments={activeNote.attachments}
                          onUpdate={(content) =>
                            updateNote(activeNote.id, { content })
                          }
                          onUpload={async (files) => {
                            if (!activeNote || activeNote.isTrashed) return [];
                            const attachments = await processFiles(files);
                            attachments.forEach((att) =>
                              addAttachment(activeNote.id, att),
                            );
                            return attachments;
                          }}
                          onImageClick={setSelectedPreviewImage}
                          onAttachmentResize={(attId, width) =>
                            resizeAttachment(activeNote.id, attId, width)
                          }
                          fontSizeClass={fontSizeClass}
                          disabled={activeNote.isTrashed}
                        />
                      </>
                    ) : (
                      <NoteReadingView
                        title={activeNote.title}
                        content={activeNote.content}
                        attachments={activeNote.attachments}
                        onImageClick={setSelectedPreviewImage}
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-6">
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-full">
                  <FileText size={64} strokeWidth={1} />
                </div>
                <div className="text-center italic">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Private workspace
                  </h2>
                  <p className="text-sm">
                    Select a note or create a new one to begin.
                  </p>
                </div>
                <button
                  onClick={() => setActiveNoteId(createNote()?.id || null)}
                  className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
                >
                  <Plus size={20} /> New Note
                </button>
              </div>
            )}
          </main>
        </div>
      </SignedIn>
    </>
  );
};

export default App;
