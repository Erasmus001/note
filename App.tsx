import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star,
  Trash2,
  Tag,
  Sun,
  Moon,
  X,
  CheckCircle2,
  Eye,
  Edit3,
  Paperclip,
  Link as LinkIcon,
  Download,
  RefreshCw,
  AlertTriangle,
  Folder as FolderIcon,
  Type,
  Monitor,
  Database,
  ShieldCheck,
  Hash,
  Pencil,
  Cloud,
  Upload,
  HardDrive,
  FileText,
  Plus
} from 'lucide-react';

// Import types and constants
import { Note, Folder, ViewMode, AppSettings, Attachment } from './types';
import { INITIAL_NOTES, INITIAL_FOLDERS, APP_ID } from './constants';

// Import extracted components
import {
  Sidebar,
  NoteExplorer,
  BlockEditor,
  NoteReadingView,
  ImagePreviewModal,
  FolderModal,
  UrlModal,
  BlockEditorRef
} from './src/components';

// Import utilities
import { getYouTubeId, getTweetId, processFiles } from './src/utils';

const App: React.FC = () => {
  // Apply theme on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(`${APP_ID}-settings`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) { }
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // --- State ---
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-notes`);
      const parsed = saved ? JSON.parse(saved) : INITIAL_NOTES;
      return parsed.map((n: any) => ({ ...n, attachments: n.attachments || [] }));
    } catch (e) {
      return INITIAL_NOTES;
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-folders`);
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch (e) {
      return INITIAL_FOLDERS;
    }
  });

  const [currentView, setCurrentView] = useState<{ mode: ViewMode; id?: string }>({ mode: ViewMode.All });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastCloudSync, setLastCloudSync] = useState<number | null>(() => {
    const saved = localStorage.getItem(`${APP_ID}-last-sync`);
    return saved ? parseInt(saved, 10) : null;
  });
  const [syncTokens, setSyncTokens] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-sync-tokens`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<Attachment | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'editor' | 'tags' | 'sync' | 'data'>('appearance');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-settings`);
      return saved ? JSON.parse(saved) : { theme: 'dark', fontSize: 'base', editorWidth: 'standard' };
    } catch (e) {
      return { theme: 'dark', fontSize: 'base', editorWidth: 'standard' };
    }
  });

  const tagInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const isCreatingNoteRef = useRef(false);
  const blockEditorRef = useRef<BlockEditorRef>(null);

  // --- Derived State ---
  const filteredNotes = React.useMemo(() => {
    let result = notes;
    if (currentView.mode === ViewMode.Starred) result = result.filter(n => n.isStarred && !n.isTrashed);
    else if (currentView.mode === ViewMode.Trash) result = result.filter(n => n.isTrashed);
    else if (currentView.mode === ViewMode.Folder) result = result.filter(n => n.folderId === currentView.id && !n.isTrashed);
    else if (currentView.mode === ViewMode.Tag) result = result.filter(n => n.tags.includes(currentView.id || '') && !n.isTrashed);
    else result = result.filter(n => !n.isTrashed);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)));
    }

    return [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, currentView, searchQuery]);

  const activeNote = React.useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId]);

  const tagUsage = React.useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(n => {
      if (!n.isTrashed) {
        n.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      }
    });
    return counts;
  }, [notes]);

  const allTags = React.useMemo(() => Object.keys(tagUsage).sort((a, b) => tagUsage[b] - tagUsage[a]), [tagUsage]);

  const isCloudConnected = Object.keys(syncTokens).length > 0;
  const fontSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[settings.fontSize];
  const editorWidthClass = { narrow: 'max-w-2xl', standard: 'max-w-4xl', full: 'max-w-full' }[settings.editorWidth];

  // --- Handlers ---
  const createNewNote = useCallback(() => {
    isCreatingNoteRef.current = true;
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      tags: [],
      attachments: [],
      isPinned: false,
      isStarred: false,
      isTrashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      readTime: 0,
      folderId: currentView.mode === ViewMode.Folder ? currentView.id : undefined
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    if (currentView.mode !== ViewMode.Folder) {
      setCurrentView({ mode: ViewMode.All });
    }
  }, [currentView]);

  const updateActiveNote = useCallback((updates: Partial<Note>) => {
    if (!activeNoteId || activeNote?.isTrashed) return;
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, [activeNoteId, activeNote?.isTrashed]);

  const handleAttachmentResize = useCallback((attachmentId: string, newWidth: number) => {
    if (!activeNoteId || activeNote?.isTrashed) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          attachments: n.attachments.map(a => a.id === attachmentId ? { ...a, width: newWidth } : a),
          updatedAt: Date.now()
        };
      }
      return n;
    }));
  }, [activeNoteId, activeNote?.isTrashed]);

  const handleProcessFiles = async (files: File[]): Promise<Attachment[]> => {
    const validAttachments = await processFiles(files);
    if (validAttachments.length > 0 && activeNoteId) {
      setNotes(prev => prev.map(n => n.id === activeNoteId ? {
        ...n,
        attachments: [...n.attachments, ...validAttachments],
        updatedAt: Date.now()
      } : n));
    }
    return validAttachments;
  };

  const handleAddTag = useCallback(() => {
    if (newTagValue.trim() && activeNote && !activeNote.isTrashed) {
      const tag = newTagValue.trim().toLowerCase();
      if (!activeNote.tags.includes(tag)) {
        updateActiveNote({ tags: [...activeNote.tags, tag] });
      }
    }
    setNewTagValue('');
    setIsAddingTag(false);
  }, [newTagValue, activeNote, updateActiveNote]);

  const handleAddUrl = () => {
    if (!activeNote || !newUrlValue.trim() || activeNote.isTrashed) return;

    let urlString = newUrlValue.trim();
    if (!/^https?:\/\//i.test(urlString)) urlString = `https://${urlString}`;

    const id = `att-${Date.now()}`;
    let name = 'Web Link';

    const ytId = getYouTubeId(urlString);
    const twId = getTweetId(urlString);

    if (ytId) name = 'YouTube Video';
    else if (twId) name = 'Tweet';
    else {
      try {
        const urlObj = new URL(urlString);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          name = pathSegments[pathSegments.length - 1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else {
          name = urlObj.hostname;
        }
      } catch (e) { name = urlString; }
    }

    const attachment: Attachment = { id, name, type: 'url', url: urlString };
    const reference = `\n[Link: ${name}](${id})\n`;

    updateActiveNote({ attachments: [...activeNote.attachments, attachment] });
    if (blockEditorRef.current) {
      blockEditorRef.current.insertContent(reference);
    }

    setNewUrlValue('');
    setShowUrlModal(false);
  };

  const handleSaveFolder = useCallback(() => {
    if (newFolderName.trim()) {
      const newFolder: Folder = {
        id: `f-${Date.now()}`,
        name: newFolderName.trim(),
        icon: newFolderIcon || '📁'
      };
      setFolders(prev => [...prev, newFolder]);
      setCurrentView({ mode: ViewMode.Folder, id: newFolder.id });
      setNewFolderName('');
      setShowFolderModal(false);
    }
  }, [newFolderName, newFolderIcon]);

  const toggleStar = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isStarred: !n.isStarred } : n));
  const togglePin = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: true, isPinned: false } : n));
    if (activeNoteId === id) setActiveNoteId(null);
  };
  const restoreNote = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: false } : n));
  const deletePermanently = (id: string) => {
    if (!confirm('Are you sure you want to delete this note permanently?')) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveNoteId(null);
  };

  const toggleTheme = () => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));

  const renameGlobalTag = (oldTag: string) => {
    const newTag = prompt(`Rename tag "${oldTag}" to:`, oldTag);
    if (newTag && newTag.trim() && newTag.trim() !== oldTag) {
      const cleanNewTag = newTag.trim().toLowerCase();
      setNotes(prev => prev.map(n => ({
        ...n,
        tags: n.tags.map(t => t === oldTag ? cleanNewTag : t).filter((t, i, self) => self.indexOf(t) === i)
      })));
    }
  };

  const deleteGlobalTag = (tagToDelete: string) => {
    if (confirm(`Remove tag "${tagToDelete}" from all notes?`)) {
      setNotes(prev => prev.map(n => ({ ...n, tags: n.tags.filter(t => t !== tagToDelete) })));
    }
  };

  const handleExportData = () => {
    const data = { notes, folders, settings, exportDate: Date.now(), appId: APP_ID };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.appId !== APP_ID) {
          if (!confirm("This backup file doesn't match the App ID. Try to import anyway?")) return;
        }
        if (confirm(`Found ${json.notes?.length || 0} notes and ${json.folders?.length || 0} folders. Replace current data?`)) {
          if (json.notes) setNotes(json.notes);
          if (json.folders) setFolders(json.folders);
          if (json.settings) setSettings(json.settings);
          alert('Import successful!');
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConnectProvider = (provider: 'google' | 'dropbox') => {
    const mockToken = `mock-token-${provider}-${Date.now()}`;
    setSyncTokens(prev => ({ ...prev, [provider]: mockToken }));
    setCloudStatus('syncing');
    setTimeout(() => {
      setCloudStatus('synced');
      setLastCloudSync(Date.now());
    }, 1500);
  };

  const handleDisconnectProvider = (provider: 'google' | 'dropbox') => {
    if (confirm(`Disconnect ${provider === 'google' ? 'Google Drive' : 'Dropbox'}?`)) {
      setSyncTokens(prev => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
    }
  };

  const clearAllData = () => {
    if (confirm('DANGER: This will permanently delete ALL notes and folders. Are you absolutely sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // --- Effects ---
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      setSaveStatus('saving');
      try {
        localStorage.setItem(`${APP_ID}-notes`, JSON.stringify(notes));
        setTimeout(() => {
          setSaveStatus('saved');
          if (isCloudConnected) {
            setCloudStatus('syncing');
            setTimeout(() => {
              setCloudStatus('synced');
              const now = Date.now();
              setLastCloudSync(now);
              localStorage.setItem(`${APP_ID}-last-sync`, now.toString());
            }, 1500);
          }
        }, 300);
      } catch (e) {
        setSaveStatus('error');
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [notes, isCloudConnected]);

  useEffect(() => {
    try { localStorage.setItem(`${APP_ID}-folders`, JSON.stringify(folders)); } catch (e) { }
  }, [folders]);

  useEffect(() => {
    try { localStorage.setItem(`${APP_ID}-sync-tokens`, JSON.stringify(syncTokens)); } catch (e) { }
  }, [syncTokens]);

  useEffect(() => {
    try { localStorage.setItem(`${APP_ID}-settings`, JSON.stringify(settings)); } catch (e) { }
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    if (isCreatingNoteRef.current) {
      setIsPreviewMode(false);
      isCreatingNoteRef.current = false;
    } else {
      setIsPreviewMode(true);
    }
    setIsAddingTag(false);
    setShowUrlModal(false);
    setShowFolderModal(false);
  }, [activeNoteId]);

  useEffect(() => { if (isAddingTag && tagInputRef.current) tagInputRef.current.focus(); }, [isAddingTag]);

  const handleFileUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !activeNoteId || activeNote?.isTrashed) return;
    if (blockEditorRef.current) {
      blockEditorRef.current.insertFiles(files);
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-hidden relative">

      {/* Settings Modal - Kept inline due to complexity */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[600px] flex overflow-hidden rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 shrink-0">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 ml-2">Settings</h2>
              <nav className="space-y-1">
                {['appearance', 'editor', 'tags', 'sync', 'data'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSettingsTab(tab as any)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === tab
                        ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                      }`}
                  >
                    {tab === 'appearance' && <Monitor size={16} />}
                    {tab === 'editor' && <Type size={16} />}
                    {tab === 'tags' && <Tag size={16} />}
                    {tab === 'sync' && <Cloud size={16} />}
                    {tab === 'data' && <Database size={16} />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold capitalize">{activeSettingsTab} Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {activeSettingsTab === 'appearance' && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Theme Mode</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setSettings(s => ({ ...s, theme: 'light' }))} className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === 'light' ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800'}`}>
                          <Sun size={24} className={settings.theme === 'light' ? 'text-amber-500' : 'text-zinc-400'} />
                          <span className="text-xs font-bold">Light Mode</span>
                        </button>
                        <button onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))} className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === 'dark' ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800'}`}>
                          <Moon size={24} className={settings.theme === 'dark' ? 'text-blue-400' : 'text-zinc-400'} />
                          <span className="text-xs font-bold">Dark Mode</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'editor' && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Font Size</h4>
                      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        {(['sm', 'base', 'lg'] as const).map(size => (
                          <button key={size} onClick={() => setSettings(s => ({ ...s, fontSize: size }))} className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${settings.fontSize === size ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>
                            {size === 'sm' ? 'Small' : size === 'base' ? 'Default' : 'Large'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Editor Width</h4>
                      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        {(['narrow', 'standard', 'full'] as const).map(width => (
                          <button key={width} onClick={() => setSettings(s => ({ ...s, editorWidth: width }))} className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${settings.editorWidth === width ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>
                            {width}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'tags' && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-500 mb-6">Manage tags globally across all notes.</p>
                    {allTags.length > 0 ? allTags.map(tag => (
                      <div key={tag} className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border group">
                        <div className="flex items-center gap-3.5">
                          <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl"><Hash size={16} /></div>
                          <div>
                            <div className="text-sm font-bold">{tag}</div>
                            <div className="text-[10px] text-zinc-400">{tagUsage[tag]} notes</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                          <button onClick={() => renameGlobalTag(tag)} className="p-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl"><Pencil size={15} /></button>
                          <button onClick={() => deleteGlobalTag(tag)} className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-zinc-400 hover:text-red-500"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-16 text-zinc-400">
                        <Tag size={40} strokeWidth={1} className="opacity-20 mx-auto mb-4" />
                        <p className="text-sm">No tags found</p>
                      </div>
                    )}
                  </div>
                )}

                {activeSettingsTab === 'sync' && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Cloud Providers</h4>
                      {['google', 'dropbox'].map((provider) => {
                        const isConnected = !!syncTokens[provider];
                        return (
                          <div key={provider} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border rounded-xl mb-3">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${isConnected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-zinc-800'}`}>
                                {provider === 'google' ? <HardDrive size={20} /> : <Cloud size={20} />}
                              </div>
                              <div>
                                <div className="font-bold text-sm capitalize">{provider === 'google' ? 'Google Drive' : 'Dropbox'}</div>
                                <div className="text-[10px] text-zinc-500">{isConnected ? `Connected` : 'Not connected'}</div>
                              </div>
                            </div>
                            <button onClick={() => isConnected ? handleDisconnectProvider(provider as any) : handleConnectProvider(provider as any)} className={`px-4 py-2 rounded-lg text-xs font-bold ${isConnected ? 'border' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'}`}>
                              {isConnected ? 'Disconnect' : 'Connect'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Manual Backup</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleExportData} className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border rounded-xl group">
                          <Download size={20} className="text-zinc-400 group-hover:text-blue-500" />
                          <div className="text-xs font-bold">Export Backup</div>
                        </button>
                        <button onClick={() => importInputRef.current?.click()} className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border rounded-xl group">
                          <Upload size={20} className="text-zinc-400 group-hover:text-green-500" />
                          <div className="text-xs font-bold">Import Backup</div>
                        </button>
                        <input ref={importInputRef} type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'data' && (
                  <div className="space-y-8">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck size={20} className="text-green-500" />
                        <h4 className="text-sm font-bold">Local Storage</h4>
                      </div>
                      <p className="text-xs text-zinc-500">Your data is stored locally in your browser.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                      <button onClick={clearAllData} className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 border border-red-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                        <Trash2 size={16} /> Clear All Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedPreviewImage && (
        <ImagePreviewModal
          image={selectedPreviewImage}
          onClose={() => setSelectedPreviewImage(null)}
        />
      )}

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        folderName={newFolderName}
        folderIcon={newFolderIcon}
        onFolderNameChange={setNewFolderName}
        onFolderIconChange={setNewFolderIcon}
        onSave={handleSaveFolder}
        onClose={() => setShowFolderModal(false)}
      />

      {/* URL Modal */}
      <UrlModal
        isOpen={showUrlModal}
        urlValue={newUrlValue}
        onUrlChange={setNewUrlValue}
        onAdd={handleAddUrl}
        onClose={() => setShowUrlModal(false)}
      />

      {/* Sidebar */}
      <Sidebar
        folders={folders}
        allTags={allTags}
        tagUsage={tagUsage}
        currentView={currentView}
        settings={settings}
        isCollapsed={isSidebarCollapsed}
        onSetCollapsed={setIsSidebarCollapsed}
        onSetView={(view) => { setCurrentView(view); setShowSettings(false); }}
        onToggleTheme={toggleTheme}
        onOpenSettings={(tab) => { setShowSettings(true); if (tab) setActiveSettingsTab(tab); }}
        onCreateFolder={() => setShowFolderModal(true)}
      />

      {/* Note Explorer */}
      <NoteExplorer
        notes={filteredNotes}
        folders={folders}
        currentView={currentView}
        activeNoteId={activeNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectNote={(id) => { setActiveNoteId(id); setShowSettings(false); }}
        onCreateNote={createNewNote}
      />

      {/* Editor/Reader Pane */}
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
                  <button onClick={() => restoreNote(activeNote.id)} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 text-xs font-bold rounded-lg border text-green-600">
                    <RefreshCw size={14} /> Restore
                  </button>
                  <button onClick={() => deletePermanently(activeNote.id)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-xs font-bold rounded-lg border text-red-600">
                    <Trash2 size={14} /> Delete Forever
                  </button>
                </div>
              </div>
            )}

            <div className="h-14 border-b flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                <span>{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.name : 'Drafts'}</span>
                {isCloudConnected && (
                  <>
                    <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                    {cloudStatus === 'syncing' && <div className="text-blue-500 flex items-center gap-1 animate-pulse"><Cloud size={12} /> Syncing...</div>}
                    {cloudStatus === 'synced' && <div className="text-blue-500 flex items-center gap-1"><Cloud size={12} /> Synced</div>}
                  </>
                )}
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                {saveStatus === 'saving' && <div className="animate-pulse">Saving...</div>}
                {saveStatus === 'saved' && <div className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> Saved</div>}
                {saveStatus === 'error' && <div className="text-red-500 font-bold">Storage Full!</div>}
              </div>
              <div className="flex items-center gap-2">
                {!activeNote.isTrashed && (
                  <>
                    <button onClick={() => toggleStar(activeNote.id)} className={`p-2 rounded-lg ${activeNote.isStarred ? 'text-yellow-500' : 'text-zinc-400'}`}><Star size={18} fill={activeNote.isStarred ? 'currentColor' : 'none'} /></button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
                  </>
                )}
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${isPreviewMode ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500'}`}>
                  {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                  {isPreviewMode ? 'Edit' : 'Read Mode'}
                </button>
                {!activeNote.isTrashed && (
                  <button onClick={() => moveToTrash(activeNote.id)} className="p-2 hover:text-red-500 text-zinc-400"><Trash2 size={18} /></button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 relative">
              <div className={`mx-auto ${editorWidthClass} space-y-8 pb-32`}>
                {!isPreviewMode ? (
                  <>
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => updateActiveNote({ title: e.target.value })}
                      disabled={activeNote.isTrashed}
                      placeholder="Note Title..."
                      className="w-full text-4xl md:text-5xl font-extrabold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-200 dark:placeholder:text-zinc-800"
                    />
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        {activeNote.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-full flex items-center gap-1 group/tag">
                            #{t}
                            {!activeNote.isTrashed && (
                              <button onClick={() => updateActiveNote({ tags: activeNote.tags.filter(tag => tag !== t) })} className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100"><X size={10} /></button>
                            )}
                          </span>
                        ))}
                        {!activeNote.isTrashed && (
                          isAddingTag ? (
                            <input ref={tagInputRef} type="text" value={newTagValue} onChange={e => setNewTagValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} onBlur={handleAddTag} placeholder="..." className="px-2 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none w-16 text-[10px]" />
                          ) : (
                            <button onClick={() => setIsAddingTag(true)} className="px-2 py-0.5 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[10px] rounded-full"><Plus size={10} /> Tag</button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => !activeNote.isTrashed && fileInputRef.current?.click()} disabled={activeNote.isTrashed} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30">
                          <Paperclip size={14} /> Add File
                        </button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUploadInput} />
                        <button onClick={() => !activeNote.isTrashed && setShowUrlModal(true)} disabled={activeNote.isTrashed} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30">
                          <LinkIcon size={14} /> Web Link
                        </button>
                      </div>
                    </div>

                    <BlockEditor
                      ref={blockEditorRef}
                      content={activeNote.content}
                      attachments={activeNote.attachments}
                      onUpdate={(newContent) => updateActiveNote({ content: newContent })}
                      onUpload={handleProcessFiles}
                      onImageClick={(att) => setSelectedPreviewImage(att)}
                      onAttachmentResize={handleAttachmentResize}
                      fontSizeClass={fontSizeClass}
                      disabled={activeNote.isTrashed}
                    />
                  </>
                ) : (
                  <NoteReadingView
                    title={activeNote.title}
                    content={activeNote.content}
                    attachments={activeNote.attachments}
                    onImageClick={(att) => setSelectedPreviewImage(att)}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-6">
            <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-full"><FileText size={64} strokeWidth={1} /></div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Private workspace</h2>
              <p className="text-sm">Select a note from the left or create a new one to begin.</p>
            </div>
            <button onClick={createNewNote} className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl">
              <Plus size={20} /> New Note
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;