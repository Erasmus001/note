import React, { useState, useEffect, useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  FileText, 
  Star, 
  Trash2, 
  Settings as SettingsIcon, 
  Search, 
  Plus, 
  Tag, 
  Pin, 
  Sun, 
  Moon, 
  Info, 
  Menu, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Eye, 
  Edit3, 
  Paperclip, 
  Link as LinkIcon, 
  Music, 
  Film, 
  Download, 
  Globe, 
  FileIcon, 
  ImageIcon, 
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Folder as FolderIcon,
  Type,
  Monitor,
  Database,
  ShieldCheck,
  Hash,
  Pencil,
  GripVertical,
  Cloud,
  Check,
  Upload,
  HardDrive
} from 'lucide-react';
import { Note, Folder, ViewMode, AppSettings, Attachment } from './types';
import { INITIAL_NOTES, INITIAL_FOLDERS, APP_ID } from './constants';

// --- Helper Types for Block Editor ---
type Block = 
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'attachment'; content: string; attachmentId: string };

const App: React.FC = () => {
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
  
  // Storage & Sync Status
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

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<Attachment | null>(null);
  
  // UI states
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState('');
  
  // Settings Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'appearance' | 'editor' | 'tags' | 'sync' | 'data'>('appearance');

  // Folder Modal states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('📁');

  const tagInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  // Ref for the BlockEditor to allow external insertion
  const blockEditorRef = useRef<{ insertContent: (text: string) => void, insertFiles: (files: File[]) => void }>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-settings`);
      return saved ? JSON.parse(saved) : {
        theme: 'dark',
        fontSize: 'base',
        editorWidth: 'standard'
      };
    } catch (e) {
      return { theme: 'dark', fontSize: 'base', editorWidth: 'standard' };
    }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- Derived State ---
  const filteredNotes = useMemo(() => {
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

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId) || null, [notes, activeNoteId]);

  const tagUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach(n => {
      if (!n.isTrashed) {
        n.tags.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return counts;
  }, [notes]);

  const allTags = useMemo(() => {
    return Object.keys(tagUsage).sort((a, b) => tagUsage[b] - tagUsage[a]);
  }, [tagUsage]);

  const isCloudConnected = Object.keys(syncTokens).length > 0;

  // --- Handlers ---
  const createNewNote = useCallback(() => {
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

  // --- Effects ---
  useEffect(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(`${APP_ID}-notes`, JSON.stringify(notes));
      const timer = setTimeout(() => {
        setSaveStatus('saved');
        
        // Trigger Cloud Sync if connected
        if (isCloudConnected) {
          setCloudStatus('syncing');
          setTimeout(() => {
            setCloudStatus('synced');
            const now = Date.now();
            setLastCloudSync(now);
            localStorage.setItem(`${APP_ID}-last-sync`, now.toString());
          }, 1500); // Simulate network delay
        }
      }, 600);
      return () => clearTimeout(timer);
    } catch (e) {
      setSaveStatus('error');
    }
  }, [notes, isCloudConnected]);

  useEffect(() => {
    try {
      localStorage.setItem(`${APP_ID}-folders`, JSON.stringify(folders));
    } catch (e) {}
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem(`${APP_ID}-sync-tokens`, JSON.stringify(syncTokens));
    } catch (e) {}
  }, [syncTokens]);

  useEffect(() => {
    try {
      localStorage.setItem(`${APP_ID}-settings`, JSON.stringify(settings));
    } catch (e) {}
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    setIsPreviewMode(false);
    setIsAddingTag(false);
    setShowUrlModal(false);
    setShowFolderModal(false);
  }, [activeNoteId]);

  useEffect(() => { if (isAddingTag && tagInputRef.current) tagInputRef.current.focus(); }, [isAddingTag]);
  useEffect(() => { if (showUrlModal && urlInputRef.current) urlInputRef.current.focus(); }, [showUrlModal]);
  useEffect(() => { if (showFolderModal && folderInputRef.current) folderInputRef.current.focus(); }, [showFolderModal]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows/Linux) or Cmd (Mac)
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        
        // New Note (Ctrl+N)
        if (key === 'n') {
          e.preventDefault();
          createNewNote();
        } 
        // Save (Ctrl+S) - Visual trigger only as auto-save is active
        else if (key === 's') {
          e.preventDefault();
          setSaveStatus('saving');
          setTimeout(() => setSaveStatus('saved'), 600);
        } 
        // Toggle Preview (Ctrl+P)
        else if (key === 'p') {
          e.preventDefault();
          setIsPreviewMode(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewNote]);

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

  const updateActiveNote = useCallback((updates: Partial<Note>) => {
    if (!activeNoteId || activeNote?.isTrashed) return;
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, [activeNoteId, activeNote?.isTrashed]);

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

  // Global Tag Management
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
      setNotes(prev => prev.map(n => ({
        ...n,
        tags: n.tags.filter(t => t !== tagToDelete)
      })));
    }
  };

  // Process files
  const processFiles = async (files: File[]): Promise<Attachment[]> => {
     const MAX_FILE_SIZE = 2.5 * 1024 * 1024;
     const results = await Promise.all(files.map(file => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" exceeds the 2.5MB limit.`);
        return null;
      }
      return new Promise<Attachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          let type: Attachment['type'] = 'document';
          if (file.type.startsWith('audio/')) type = 'audio';
          else if (file.type.startsWith('video/')) type = 'video';
          else if (file.type.startsWith('image/')) type = 'image';
          
          const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          resolve({ id, name: file.name, type, url: base64, size: file.size });
        };
        reader.onerror = () => resolve({ id: `err-${Date.now()}`, name: file.name, type: 'document', url: '' });
        reader.readAsDataURL(file);
      });
    }));

    const validAttachments = results.filter((r): r is Attachment => r !== null && !r.id.startsWith('err'));
    
    if (validAttachments.length > 0) {
      setNotes(prev => prev.map(n => n.id === activeNoteId ? {
        ...n,
        attachments: [...n.attachments, ...validAttachments],
        updatedAt: Date.now()
      } : n));
    }
    return validAttachments;
  };

  const handleFileUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !activeNoteId || activeNote?.isTrashed) return;
    
    if (blockEditorRef.current) {
      blockEditorRef.current.insertFiles(files);
    }
    e.target.value = '';
  };

  const handleAddUrl = () => {
    if (!activeNote || !newUrlValue.trim() || activeNote.isTrashed) return;
    const url = newUrlValue.trim().startsWith('http') ? newUrlValue.trim() : `https://${newUrlValue.trim()}`;
    const id = `att-${Date.now()}`;
    const attachment: Attachment = { id, name: 'Web Link', type: 'url', url };
    const reference = `\n[Link: ${url}](${id})\n`;
    
    updateActiveNote({ attachments: [...activeNote.attachments, attachment] });
    if (blockEditorRef.current) {
      blockEditorRef.current.insertContent(reference);
    }

    setNewUrlValue('');
    setShowUrlModal(false);
  };

  // Sync Logic
  const handleConnectProvider = (provider: 'google' | 'dropbox') => {
    // Simulating an OAuth flow with a timeout
    const mockToken = `mock-token-${provider}-${Date.now()}`;
    setSyncTokens(prev => ({ ...prev, [provider]: mockToken }));
    setCloudStatus('syncing');
    setTimeout(() => {
      setCloudStatus('synced');
      setLastCloudSync(Date.now());
    }, 1500);
  };

  const handleDisconnectProvider = (provider: 'google' | 'dropbox') => {
    if (confirm(`Disconnect ${provider === 'google' ? 'Google Drive' : 'Dropbox'}? This will stop syncing.`)) {
      setSyncTokens(prev => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
    }
  };

  // Import/Export Logic
  const handleExportData = () => {
    const data = {
      notes,
      folders,
      settings,
      exportDate: Date.now(),
      appId: APP_ID
    };
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

  const toggleStar = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isStarred: !n.isStarred } : n));
  const togglePin = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  
  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: true, isPinned: false } : n));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const restoreNote = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: false } : n));
  };

  const deletePermanently = (id: string) => {
    if (!confirm('Are you sure you want to delete this note permanently? This action cannot be undone.')) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveNoteId(null);
  };

  const clearAllData = () => {
    if (confirm('DANGER: This will permanently delete ALL notes and folders. Are you absolutely sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const fontSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[settings.fontSize];
  const editorWidthClass = { narrow: 'max-w-2xl', standard: 'max-w-4xl', full: 'max-w-full' }[settings.editorWidth];

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200 overflow-hidden relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl h-[600px] flex overflow-hidden rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            {/* Settings Sidebar */}
            <div className="w-48 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 shrink-0">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 ml-2">Settings</h2>
              <nav className="space-y-1">
                <button onClick={() => setActiveSettingsTab('appearance')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'appearance' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                  <Monitor size={16}/> Appearance
                </button>
                <button onClick={() => setActiveSettingsTab('editor')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'editor' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                  <Type size={16}/> Editor
                </button>
                <button onClick={() => setActiveSettingsTab('tags')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'tags' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                  <Tag size={16}/> Tag Manager
                </button>
                <button onClick={() => setActiveSettingsTab('sync')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'sync' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                  <Cloud size={16}/> Sync & Backup
                </button>
                <button onClick={() => setActiveSettingsTab('data')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'data' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}`}>
                  <Database size={16}/> Data & Safety
                </button>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold capitalize">{activeSettingsTab === 'tags' ? 'Tag Manager' : activeSettingsTab === 'sync' ? 'Sync & Backup' : `${activeSettingsTab} Settings`}</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {activeSettingsTab === 'appearance' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Theme Mode</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setSettings(s => ({...s, theme: 'light'}))}
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === 'light' ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                        >
                          <Sun size={24} className={settings.theme === 'light' ? 'text-amber-500' : 'text-zinc-400'} />
                          <span className="text-xs font-bold">Light Mode</span>
                        </button>
                        <button 
                          onClick={() => setSettings(s => ({...s, theme: 'dark'}))}
                          className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${settings.theme === 'dark' ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                        >
                          <Moon size={24} className={settings.theme === 'dark' ? 'text-blue-400' : 'text-zinc-400'} />
                          <span className="text-xs font-bold">Dark Mode</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'editor' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Font Size</h4>
                      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        {(['sm', 'base', 'lg'] as const).map(size => (
                          <button 
                            key={size}
                            onClick={() => setSettings(s => ({...s, fontSize: size}))}
                            className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${settings.fontSize === size ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                            {size === 'sm' ? 'Small' : size === 'base' ? 'Default' : 'Large'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Editor Max Width</h4>
                      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        {(['narrow', 'standard', 'full'] as const).map(width => (
                          <button 
                            key={width}
                            onClick={() => setSettings(s => ({...s, editorWidth: width}))}
                            className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${settings.editorWidth === width ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                            {width}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'tags' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Manage tags globally. Renaming a tag updates it across all notes in your workspace.</p>
                    <div className="space-y-2.5">
                      {allTags.length > 0 ? allTags.map(tag => (
                        <div key={tag} className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60 group hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                          <div className="flex items-center gap-3.5">
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl text-zinc-400 shadow-sm"><Hash size={16}/></div>
                            <div>
                              <div className="text-sm font-bold tracking-tight">{tag}</div>
                              <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{tagUsage[tag]} {tagUsage[tag] === 1 ? 'note' : 'notes'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 md:opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => renameGlobalTag(tag)}
                              className="p-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
                              title="Rename Tag"
                            >
                              <Pencil size={15}/>
                            </button>
                            <button 
                              onClick={() => deleteGlobalTag(tag)}
                              className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-zinc-400 hover:text-red-500 transition-all"
                              title="Delete Tag Everywhere"
                            >
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-16 text-zinc-400">
                          <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-full inline-block mb-4"><Tag size={40} strokeWidth={1} className="opacity-20" /></div>
                          <p className="text-sm font-medium">No tags found in your library.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'sync' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Cloud Providers</h4>
                      <div className="space-y-3">
                        {['google', 'dropbox'].map((provider) => {
                          const isConnected = !!syncTokens[provider];
                          return (
                            <div key={provider} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${isConnected ? 'bg-blue-500 text-white' : 'bg-white dark:bg-zinc-800 text-zinc-400'}`}>
                                  {provider === 'google' ? <HardDrive size={20}/> : <Cloud size={20}/>}
                                </div>
                                <div>
                                  <div className="font-bold capitalize text-sm">{provider === 'google' ? 'Google Drive' : 'Dropbox'}</div>
                                  <div className="text-[10px] text-zinc-500">
                                    {isConnected ? `Connected • Last sync: ${lastCloudSync ? new Date(lastCloudSync).toLocaleTimeString() : 'Just now'}` : 'Not connected'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => isConnected ? handleDisconnectProvider(provider as any) : handleConnectProvider(provider as any)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${isConnected ? 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent hover:opacity-90'}`}
                              >
                                {isConnected ? 'Disconnect' : 'Connect'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Manual Backup</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleExportData} className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all group">
                          <div className="p-3 bg-white dark:bg-zinc-800 rounded-full text-zinc-400 group-hover:text-blue-500 transition-colors shadow-sm"><Download size={20}/></div>
                          <div className="text-center">
                            <div className="text-xs font-bold">Export Backup</div>
                            <div className="text-[10px] text-zinc-400 mt-1">Download JSON file</div>
                          </div>
                        </button>
                        <button onClick={() => importInputRef.current?.click()} className="flex flex-col items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl transition-all group">
                          <div className="p-3 bg-white dark:bg-zinc-800 rounded-full text-zinc-400 group-hover:text-green-500 transition-colors shadow-sm"><Upload size={20}/></div>
                          <div className="text-center">
                            <div className="text-xs font-bold">Import Backup</div>
                            <div className="text-[10px] text-zinc-400 mt-1">Restore from JSON</div>
                          </div>
                        </button>
                        <input ref={importInputRef} type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'data' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-1 duration-200">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck size={20} className="text-green-500" />
                        <h4 className="text-sm font-bold">Local Encryption</h4>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">Your data is stored exclusively in your browser's local storage. We never upload your personal notes to our servers unless you explicitly connect a cloud provider.</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Danger Zone</h4>
                      <button 
                        onClick={clearAllData}
                        className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16}/> Clear All Database
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setSelectedPreviewImage(null)}>
          <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X size={24} />
          </button>
          <img 
            src={selectedPreviewImage.url} 
            alt={selectedPreviewImage.name} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Folder Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><FolderIcon size={18} /> Create New Folder</h3>
              <button onClick={() => setShowFolderModal(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Folder Name</label>
                <input 
                  ref={folderInputRef}
                  type="text" 
                  placeholder="e.g. Daily Thoughts" 
                  value={newFolderName} 
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm transition-all focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Icon (Emoji)</label>
                <input 
                  type="text" 
                  placeholder="📁" 
                  value={newFolderIcon} 
                  onChange={e => setNewFolderIcon(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-sm transition-all focus:border-zinc-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowFolderModal(false)} className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleSaveFolder} disabled={!newFolderName.trim()} className="flex-1 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">Create Folder</button>
            </div>
          </div>
        </div>
      )}

      {/* Web Link Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Add Web Link</h3>
              <button onClick={() => setShowUrlModal(false)} className="text-zinc-400"><X size={20}/></button>
            </div>
            <input 
              ref={urlInputRef}
              type="text" 
              placeholder="https://example.com" 
              value={newUrlValue} 
              onChange={e => setNewUrlValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl mb-6 outline-none text-sm"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowUrlModal(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleAddUrl} className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-medium">Add Link</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 shrink-0 bg-white dark:bg-zinc-950`}>
        <div className="p-4 flex items-center justify-between shrink-0">
          {!isSidebarCollapsed && <div className="font-bold text-xl tracking-tighter">Super Notes</div>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500"><Menu size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <SidebarNavItem icon={<FileText size={18} />} label="All Notes" active={currentView.mode === ViewMode.All} collapsed={isSidebarCollapsed} onClick={() => { setCurrentView({ mode: ViewMode.All }); setShowSettings(false); }} />
          <SidebarNavItem icon={<Star size={18} />} label="Starred" active={currentView.mode === ViewMode.Starred} collapsed={isSidebarCollapsed} onClick={() => { setCurrentView({ mode: ViewMode.Starred }); setShowSettings(false); }} />
          <SidebarNavItem icon={<Trash2 size={18} />} label="Trash" active={currentView.mode === ViewMode.Trash} collapsed={isSidebarCollapsed} onClick={() => { setCurrentView({ mode: ViewMode.Trash }); setShowSettings(false); }} />
          {!isSidebarCollapsed && (
            <>
              <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between group">
                <span>Folders</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowFolderModal(true); }} 
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Create New Folder"
                >
                  <Plus size={14} />
                </button>
              </div>
              {folders.map(f => (<SidebarNavItem key={f.id} icon={<span>{f.icon}</span>} label={f.name} active={currentView.mode === ViewMode.Folder && currentView.id === f.id} onClick={() => { setCurrentView({ mode: ViewMode.Folder, id: f.id }); setShowSettings(false); }} />))}
              
              <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                <span>Tags</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowSettings(true); setActiveSettingsTab('tags'); }} 
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  title="Manage Tags"
                >
                  <SettingsIcon size={14} />
                </button>
              </div>
              <div className="px-2 space-y-1">
                {allTags.map(tag => (
                  <SidebarNavItem 
                    key={tag} 
                    icon={<Tag size={14} />} 
                    label={`${tag} (${tagUsage[tag]})`} 
                    active={currentView.mode === ViewMode.Tag && currentView.id === tag} 
                    onClick={() => { setCurrentView({ mode: ViewMode.Tag, id: tag }); setShowSettings(false); }} 
                  />
                ))}
              </div>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))} 
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            title="Toggle Theme"
          >
            {settings.theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
          </button>
          <button 
            onClick={() => { setShowSettings(true); setActiveSettingsTab('appearance'); }}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
            title="Open Settings"
          >
            <SettingsIcon size={20}/>
          </button>
        </div>
      </aside>

      {/* Explorer */}
      <aside className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="font-semibold capitalize text-sm">{currentView.mode === ViewMode.Folder ? folders.find(f => f.id === currentView.id)?.name : currentView.mode}</h2>
          <button onClick={createNewNote} className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"><Plus size={18} /></button>
        </div>
        <div className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input type="text" placeholder="Filter notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg outline-none text-xs" /></div></div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length > 0 ? filteredNotes.map(note => (<NoteListItem key={note.id} note={note} active={activeNoteId === note.id} onClick={() => { setActiveNoteId(note.id); setShowSettings(false); }} />)) : (<div className="flex flex-col items-center justify-center h-48 text-zinc-400"><Info size={24} className="mb-2" /><p className="text-xs">No notes found</p></div>)}
        </div>
      </aside>

      {/* Editor/Reader Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        {activeNote ? (
          <>
            {activeNote.isTrashed && (
              <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3 text-zinc-500 text-sm">
                  <AlertTriangle className="text-amber-500" size={18} />
                  <span>This note is in the trash.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => restoreNote(activeNote.id)} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-sm transition-all text-green-600 dark:text-green-400">
                    <RefreshCw size={14} /> Restore Note
                  </button>
                  <button onClick={() => deletePermanently(activeNote.id)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-xs font-bold rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-100 transition-all text-red-600">
                    <Trash2 size={14} /> Delete Forever
                  </button>
                </div>
              </div>
            )}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
               <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-1"><span>{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.name : 'Drafts'}</span></div>
                
                {/* Sync Status Indicators */}
                {isCloudConnected && (
                  <>
                    <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800"></div>
                    {cloudStatus === 'syncing' && <div className="text-blue-500 flex items-center gap-1 animate-pulse"><Cloud size={12}/> Syncing...</div>}
                    {cloudStatus === 'synced' && <div className="text-blue-500 flex items-center gap-1"><Cloud size={12}/> Synced</div>}
                  </>
                )}

                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800"></div>
                {saveStatus === 'saving' && <div className="animate-pulse">Saving...</div>}
                {saveStatus === 'saved' && <div className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> Saved</div>}
                {saveStatus === 'error' && <div className="text-red-500 flex items-center gap-1 font-bold">Storage Full!</div>}
              </div>
              <div className="flex items-center gap-2">
                {!activeNote.isTrashed && (
                  <>
                    <button onClick={() => toggleStar(activeNote.id)} className={`p-2 rounded-lg transition-colors ${activeNote.isStarred ? 'text-yellow-500' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Star size={18} fill={activeNote.isStarred ? 'currentColor' : 'none'} /></button>
                    <button onClick={() => togglePin(activeNote.id)} className={`p-2 rounded-lg transition-colors ${activeNote.isPinned ? 'text-blue-500' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Pin size={18} fill={activeNote.isPinned ? 'currentColor' : 'none'} /></button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                  </>
                )}
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPreviewMode ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                  {isPreviewMode ? 'Edit' : 'Read Mode'}
                </button>
                {!activeNote.isTrashed && (
                  <button onClick={() => moveToTrash(activeNote.id)} className="p-2 hover:text-red-500 text-zinc-400 transition-colors"><Trash2 size={18} /></button>
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
                      className="w-full text-4xl md:text-5xl font-extrabold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-200 dark:placeholder:text-zinc-800 disabled:opacity-50" 
                    />
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        {activeNote.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-full flex items-center gap-1 group/tag">
                            #{t}
                            {!activeNote.isTrashed && (
                              <button onClick={() => updateActiveNote({ tags: activeNote.tags.filter(tag => tag !== t) })} className="hover:text-red-500 transition-colors opacity-0 group-hover/tag:opacity-100"><X size={10} /></button>
                            )}
                          </span>
                        ))}
                        {!activeNote.isTrashed && (
                          isAddingTag ? (
                            <input ref={tagInputRef} type="text" value={newTagValue} onChange={e => setNewTagValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} onBlur={handleAddTag} placeholder="..." className="px-2 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none w-16 text-[10px]" />
                          ) : (
                            <button onClick={() => setIsAddingTag(true)} className="px-2 py-0.5 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[10px] rounded-full hover:border-zinc-400 transition-colors"><Plus size={10} /> Tag</button>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => !activeNote.isTrashed && fileInputRef.current?.click()} 
                          disabled={activeNote.isTrashed}
                          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Paperclip size={14}/> Add File
                        </button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUploadInput} />
                        <button 
                          onClick={() => !activeNote.isTrashed && setShowUrlModal(true)} 
                          disabled={activeNote.isTrashed}
                          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <LinkIcon size={14}/> Web Link
                        </button>
                      </div>
                    </div>
                    
                    <BlockEditor 
                      ref={blockEditorRef}
                      content={activeNote.content}
                      attachments={activeNote.attachments}
                      onUpdate={(newContent) => updateActiveNote({ content: newContent })}
                      onUpload={processFiles}
                      onImageClick={(att) => setSelectedPreviewImage(att)}
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
            <button onClick={createNewNote} className="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-zinc-900/10 dark:shadow-none"><Plus size={20} /> New Workspace</button>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components ---

const SidebarNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; collapsed?: boolean; onClick: () => void; }> = ({ icon, label, active, collapsed, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-sm' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
    <span className="shrink-0">{icon}</span>{!collapsed && <span className="truncate">{label}</span>}
  </button>
);

const NoteListItem: React.FC<{ note: Note; active: boolean; onClick: () => void; }> = ({ note, active, onClick }) => (
  <div onClick={onClick} className={`group p-4 border-b border-zinc-100 dark:border-zinc-900 cursor-pointer transition-colors relative ${active ? 'bg-zinc-50 dark:bg-zinc-900' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'}`}>
    <div className="flex items-start justify-between mb-1">
      <h3 className={`font-bold text-sm truncate pr-4 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'} ${note.isTrashed ? 'italic opacity-60' : ''}`}>{note.title || 'Untitled'}</h3>
      {note.isPinned && <Pin size={12} className="text-blue-500 shrink-0" fill="currentColor" />}
    </div>
    <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed opacity-80 h-8 overflow-hidden">{note.content.substring(0, 100).trim() || 'No preview content available.'}</p>
    <div className="flex items-center justify-between mt-3">
      <div className="flex gap-1">{note.tags.slice(0, 1).map(t => (<span key={t} className="text-[9px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-sm font-bold">#{t}</span>))}</div>
      <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-tighter">{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
    </div>
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 dark:bg-zinc-100" />}
  </div>
);

/**
 * Visual renderer for attachments.
 */
const AttachmentRenderer: React.FC<{ attachment: Attachment; onImageClick?: (att: Attachment) => void }> = ({ attachment, onImageClick }) => {
  const cardClasses = "my-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl group transition-all duration-300";

  switch (attachment.type) {
    case 'audio':
      return (
        <div className={cardClasses}>
          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3"><Music size={14} className="text-rose-500"/> Audio File: {attachment.name}</div>
          <audio controls className="w-full" src={attachment.url} />
        </div>
      );
    case 'video':
      return (
        <div className={cardClasses + " overflow-hidden"}>
          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3"><Film size={14} className="text-blue-500"/> Video File: {attachment.name}</div>
          <video controls className="w-full rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800" src={attachment.url} />
        </div>
      );
    case 'image':
      return (
        <div className="my-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><ImageIcon size={14} className="text-green-500" /> {attachment.name}</div>
            <button onClick={() => onImageClick?.(attachment)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"><Maximize2 size={14}/></button>
          </div>
          <div className="relative group cursor-pointer" onClick={() => onImageClick?.(attachment)}>
            <img src={attachment.url} alt={attachment.name} className="max-w-full rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 group-hover:opacity-95 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded-2xl">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white shadow-xl"><Maximize2 size={24}/></div>
            </div>
          </div>
        </div>
      );
    case 'url':
      return (
        <div className="my-4 p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all group flex items-center justify-between">
          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl text-blue-500 shadow-sm"><Globe size={20}/></div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Visit Resource</div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{attachment.url}</div>
            </div>
            <ExternalLink size={14} className="text-zinc-300 group-hover:text-blue-500 transition-colors ml-auto" />
          </a>
        </div>
      );
    default:
      return (
        <div className="my-4 p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl group transition-all shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors shadow-inner"><FileIcon size={24} /></div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Document Attachment</div>
              <div className="text-xs font-bold truncate">{attachment.name}</div>
            </div>
          </div>
          <a href={attachment.url} download={attachment.name} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 text-[10px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all"><Download size={14}/> Save</a>
        </div>
      );
  }
};

/**
 * Custom Block Editor
 * Replaces standard textarea to allow drag-and-drop of attachment blocks
 */
interface BlockEditorProps {
  content: string;
  attachments: Attachment[];
  onUpdate: (content: string) => void;
  onUpload: (files: File[]) => Promise<Attachment[]>;
  onImageClick: (att: Attachment) => void;
  fontSizeClass: string;
  disabled: boolean;
}

const BlockEditor = forwardRef<{ insertContent: (t: string) => void, insertFiles: (f: File[]) => void }, BlockEditorProps>(({ content, attachments, onUpdate, onUpload, onImageClick, fontSizeClass, disabled }, ref) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Parse content into blocks
  const parseContent = useCallback((text: string) => {
    // Regex matches [File: name](att-id)
    const regex = /(\[(?:File|Link): .*?\]\(att-.*?\))/g;
    const parts = text.split(regex);
    const newBlocks: Block[] = [];
    
    parts.forEach((part, index) => {
      if (!part) return; // Skip empty matches
      
      const match = part.match(/^\[(?:File|Link): (.*?)\]\((att-.*?)\)$/);
      if (match) {
        newBlocks.push({
          id: `block-${index}-${match[2]}`,
          type: 'attachment',
          content: part,
          attachmentId: match[2]
        });
      } else {
        newBlocks.push({
          id: `block-${index}-text`,
          type: 'text',
          content: part
        });
      }
    });
    
    // Ensure we have at least one text block if empty
    if (newBlocks.length === 0) {
      newBlocks.push({ id: 'block-init', type: 'text', content: '' });
    }
    
    return newBlocks;
  }, []);

  // Sync blocks with content prop, but ONLY if content changed externally to avoid focus loss
  useEffect(() => {
    const currentSerialized = blocks.map(b => b.content).join('');
    if (content !== currentSerialized) {
      setBlocks(parseContent(content));
    }
  }, [content, parseContent]);

  // Handle reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    isDraggingRef.current = true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (!isDraggingRef.current) return;
    
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(fromIndex) || fromIndex === toIndex) return;

    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);

    setBlocks(newBlocks);
    onUpdate(newBlocks.map(b => b.content).join(''));
    isDraggingRef.current = false;
  };
  
  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  // Handle File Drop on Editor
  const handleEditorDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return; 
    }

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
       await insertFiles(files);
    }
  };

  const insertFiles = async (files: File[]) => {
      if (disabled) return;
      
      const newAttachments = await onUpload(files);
      if (newAttachments.length === 0) return;

      const attachmentBlocks: Block[] = newAttachments.map((att, i) => ({
        id: `block-new-att-${Date.now()}-${i}`,
        type: 'attachment',
        content: `\n[File: ${att.name}](${att.id})\n`,
        attachmentId: att.id
      }));

      // Append to end for simplicity in this version
      const newBlocks = [...blocks, ...attachmentBlocks];
      // Add a newline block after if needed
      newBlocks.push({ id: `block-pad-${Date.now()}`, type: 'text', content: '\n' });

      setBlocks(newBlocks);
      onUpdate(newBlocks.map(b => b.content).join(''));
  };

  const updateBlockContent = (index: number, newText: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], content: newText };
    setBlocks(newBlocks);
    onUpdate(newBlocks.map(b => b.content).join(''));
  };
  
  const removeBlock = (index: number) => {
      const newBlocks = [...blocks];
      newBlocks.splice(index, 1);
      setBlocks(newBlocks);
      onUpdate(newBlocks.map(b => b.content).join(''));
  };
  
  // Expose insertion methods
  useImperativeHandle(ref, () => ({
    insertContent: (text: string) => {
      const newBlocks = [...blocks];
      // Append for simplicity
      newBlocks.push({ id: `block-insert-${Date.now()}`, type: 'text', content: text });
      setBlocks(newBlocks);
      onUpdate(newBlocks.map(b => b.content).join(''));
    },
    insertFiles
  }));

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full min-h-[60vh] pb-32 outline-none ${disabled ? 'opacity-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleEditorDrop}
    >
      {blocks.map((block, index) => {
        if (block.type === 'attachment') {
          const att = attachments.find(a => a.id === block.attachmentId);
          return (
            <div 
              key={block.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className="group relative my-2 pl-6 pr-2 py-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-grab active:cursor-grabbing"
            >
               <div className="absolute left-1 top-1/2 -translate-y-1/2 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                 <GripVertical size={16} />
               </div>
               
               <button 
                  onClick={(e) => {
                      e.stopPropagation(); 
                      removeBlock(index);
                  }}
                  className="absolute right-2 top-2 p-1.5 bg-white/80 dark:bg-black/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-zinc-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Remove attachment"
               >
                  <X size={14} />
               </button>

               {att ? (
                 <div className="">
                    <AttachmentRenderer attachment={att} onImageClick={onImageClick} />
                 </div>
               ) : (
                 <div className="p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs rounded-lg">Missing Attachment: {block.attachmentId}</div>
               )}
            </div>
          );
        } else {
          return (
            <textarea
              key={block.id}
              value={block.content}
              onChange={(e) => {
                updateBlockContent(index, e.target.value);
                autoResize(e);
              }}
              disabled={disabled}
              placeholder={index === 0 && blocks.length === 1 ? "Start capturing your thoughts..." : undefined}
              className={`w-full bg-transparent border-none outline-none resize-none leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-200 dark:placeholder:text-zinc-800 ${fontSizeClass} overflow-hidden`}
              style={{ minHeight: '1.5em' }}
              onFocus={(e) => autoResize(e as any)}
            />
          );
        }
      })}
      
      {/* Visual cue for drop zone */}
      <div className="mt-8 p-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl text-center text-zinc-300 dark:text-zinc-700 text-sm pointer-events-none">
        Drag and drop files here to upload
      </div>
    </div>
  );
});

const NoteReadingView: React.FC<{ title: string; content: string; attachments: Attachment[]; onImageClick: (att: Attachment) => void }> = ({ title, content, attachments, onImageClick }) => {
  const lines = content.split('\n');
  
  return (
    <div className="relative">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-12 pb-6 border-b border-zinc-100 dark:border-zinc-900">{title || 'Untitled Note'}</h1>
      <div className="space-y-4">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-4" />;

          const attachmentMatch = line.match(/^\[(File|Link): (.*?)\]\((att-.*?)\)$/);
          if (attachmentMatch) {
            const attId = attachmentMatch[3];
            const attachment = attachments.find(a => a.id === attId);
            if (attachment) {
              return <AttachmentRenderer key={idx} attachment={attachment} onImageClick={onImageClick} />;
            }
          }

          return <p key={idx} className="leading-relaxed text-zinc-700 dark:text-zinc-300 text-lg">{line}</p>;
        })}
      </div>
    </div>
  );
};

export default App;