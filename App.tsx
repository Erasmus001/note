
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FileText, 
  Star, 
  Trash2, 
  Settings, 
  Search, 
  Plus, 
  Tag, 
  ChevronRight, 
  MoreHorizontal, 
  Pin, 
  History, 
  Share2, 
  ArrowLeft,
  Layout,
  Sun,
  Moon,
  Info,
  Menu,
  X,
  Clock,
  ExternalLink,
  Code,
  CheckCircle2,
  CloudUpload,
  Eye,
  Edit3,
  Paperclip,
  Link as LinkIcon,
  Music,
  Film,
  File,
  Download,
  Globe,
  FileIcon
} from 'lucide-react';
import { Note, Folder, ViewMode, AppSettings, Attachment } from './types';
import { INITIAL_NOTES, INITIAL_FOLDERS, APP_ID } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(`${APP_ID}-notes`);
    const parsed = saved ? JSON.parse(saved) : INITIAL_NOTES;
    return parsed.map((n: any) => ({ ...n, attachments: n.attachments || [] }));
  });
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem(`${APP_ID}-folders`);
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });
  const [currentView, setCurrentView] = useState<{ mode: ViewMode; id?: string }>({ mode: ViewMode.All });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(INITIAL_NOTES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // UI states
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  // URL Modal states
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState('');
  const [lastSelectionStart, setLastSelectionStart] = useState<number>(0);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`${APP_ID}-settings`);
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      fontSize: 'base',
      editorWidth: 'standard',
      defaultMarkdown: false
    };
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  // --- Effects ---
  useEffect(() => {
    setSaveStatus('saving');
    localStorage.setItem(`${APP_ID}-notes`, JSON.stringify(notes));
    const timer = setTimeout(() => setSaveStatus('saved'), 600);
    return () => clearTimeout(timer);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(`${APP_ID}-settings`, JSON.stringify(settings));
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  useEffect(() => {
    setIsPreviewMode(false);
    setIsAddingTag(false);
    setShowUrlModal(false);
    setNewTagValue('');
    setNewUrlValue('');
  }, [activeNoteId]);

  useEffect(() => { if (isAddingTag && tagInputRef.current) tagInputRef.current.focus(); }, [isAddingTag]);
  
  useEffect(() => { 
    if (showUrlModal && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [showUrlModal]);

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
      isMarkdown: settings.defaultMarkdown,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      readTime: 0,
      folderId: currentView.mode === ViewMode.Folder ? currentView.id : undefined
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  }, [settings.defaultMarkdown, currentView]);

  const updateActiveNote = useCallback((updates: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, [activeNoteId]);

  const handleAddTag = () => {
    if (!activeNote) return;
    const tag = newTagValue.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !activeNote.tags.includes(tag)) updateActiveNote({ tags: [...activeNote.tags, tag] });
    setNewTagValue('');
    setIsAddingTag(false);
  };

  const handleOpenUrlModal = () => {
    if (textareaRef.current) {
      setLastSelectionStart(textareaRef.current.selectionStart);
    }
    setShowUrlModal(true);
  };

  const handleAddUrl = () => {
    if (!activeNote || !newUrlValue.trim()) {
      setShowUrlModal(false);
      return;
    }
    const urlInput = newUrlValue.trim();
    const finalUrl = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
    let domain = 'Link';
    try {
      domain = new URL(finalUrl).hostname.replace('www.', '');
    } catch(e) {}
    const name = domain || 'Linked Resource';
    
    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name: name,
      type: 'url',
      url: finalUrl
    };

    const referenceText = `\n[Link: ${name}](${newAttachment.id})\n`;
    const content = activeNote.content;
    const pos = lastSelectionStart;
    const newContent = content.substring(0, pos) + referenceText + content.substring(pos);

    updateActiveNote({ 
      attachments: [...activeNote.attachments, newAttachment],
      content: newContent
    });
    
    setNewUrlValue('');
    setShowUrlModal(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Explicitly type files as File[] to prevent 'unknown' type errors for file properties
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !activeNoteId) return;

    // Capture position at the moment of interaction
    const initialPos = textareaRef.current ? textareaRef.current.selectionStart : 0;
    
    try {
      setSaveStatus('saving');
      
      const fileProcessingPromises = files.map((file: File) => {
        return new Promise<{ attachment: Attachment, insertText: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const type: Attachment['type'] = 
              file.type.startsWith('audio/') ? 'audio' : 
              file.type.startsWith('video/') ? 'video' : 'document';
            
            const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const newAttachment: Attachment = {
              id,
              name: file.name,
              type,
              url: base64,
              size: file.size
            };

            const insertText = `\n[File: ${file.name}](${id})\n`;
            resolve({ attachment: newAttachment, insertText });
          };
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(fileProcessingPromises);
      const newAttachments = results.map(r => r.attachment);
      const combinedInsertText = results.map(r => r.insertText).join("");

      setNotes(prev => prev.map(n => {
        if (n.id === activeNoteId) {
          const content = n.content;
          // Use current content in case it changed during upload
          const newContent = content.substring(0, initialPos) + combinedInsertText + content.substring(initialPos);
          return {
            ...n,
            attachments: [...n.attachments, ...newAttachments],
            content: newContent,
            updatedAt: Date.now()
          };
        }
        return n;
      }));
      
      setSaveStatus('saved');
    } catch (error) {
      console.error("File upload error:", error);
      setSaveStatus('idle');
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  const removeAttachment = (id: string) => {
    if (!activeNote) return;
    updateActiveNote({ attachments: activeNote.attachments.filter(a => a.id !== id) });
  };

  const toggleStar = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isStarred: !n.isStarred } : n));
  const togglePin = (id: string) => setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: !n.isTrashed } : n));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const fontSizeClass = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }[settings.fontSize];
  const editorWidthClass = { narrow: 'max-w-2xl', standard: 'max-w-4xl', full: 'max-w-full' }[settings.editorWidth];

  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden relative">
      {/* URL Input Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe size={20} className="text-zinc-500" />
                Insert Web Link
              </h3>
              <button onClick={() => setShowUrlModal(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Enter a URL to attach it to your note at the current cursor position.</p>
            <div className="relative mb-6">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                ref={urlInputRef}
                type="text" 
                placeholder="https://example.com"
                value={newUrlValue}
                onChange={(e) => setNewUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUrlModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleAddUrl} disabled={!newUrlValue.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">Insert Link</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-black">
                <Layout size={18} />
              </div>
              <span>Super Notes</span>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500"><Menu size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <SidebarNavItem icon={<FileText size={18} />} label="All Notes" active={currentView.mode === ViewMode.All} collapsed={isSidebarCollapsed} onClick={() => setCurrentView({ mode: ViewMode.All })} />
          <SidebarNavItem icon={<Star size={18} />} label="Starred" active={currentView.mode === ViewMode.Starred} collapsed={isSidebarCollapsed} onClick={() => setCurrentView({ mode: ViewMode.Starred })} />
          <SidebarNavItem icon={<Trash2 size={18} />} label="Trash" active={currentView.mode === ViewMode.Trash} collapsed={isSidebarCollapsed} onClick={() => setCurrentView({ mode: ViewMode.Trash })} />
          {!isSidebarCollapsed && (
            <>
              <div className="pt-6 pb-2 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex justify-between items-center">Folders<button className="hover:text-zinc-900 dark:hover:text-white"><Plus size={14}/></button></div>
              {folders.map(f => (<SidebarNavItem key={f.id} icon={<span>{f.icon || '📁'}</span>} label={f.name} active={currentView.mode === ViewMode.Folder && currentView.id === f.id} onClick={() => setCurrentView({ mode: ViewMode.Folder, id: f.id })} />))}
              <div className="pt-6 pb-2 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tags</div>
              <div className="px-2 space-y-1">
                {allTags.map(tag => (<SidebarNavItem key={tag} icon={<Tag size={14} />} label={tag} active={currentView.mode === ViewMode.Tag && currentView.id === tag} onClick={() => setCurrentView({ mode: ViewMode.Tag, id: tag })} />))}
              </div>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          {!isSidebarCollapsed && <div className="flex items-center gap-2 text-xs text-green-500 mb-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>Synced</div>}
          <div className="flex items-center justify-between">
            <button onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500">{settings.theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500"><Settings size={20}/></button>
          </div>
        </div>
      </aside>

      <aside className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-zinc-900 dark:text-zinc-100">
          <h2 className="font-semibold capitalize">{currentView.mode} {currentView.id ? ` - ${currentView.id}` : ''}</h2>
          <button onClick={createNewNote} className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg hover:opacity-90"><Plus size={18} /></button>
        </div>
        <div className="px-4 py-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg outline-none text-sm" /></div></div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length > 0 ? filteredNotes.map(note => (<NoteListItem key={note.id} note={note} active={activeNoteId === note.id} onClick={() => setActiveNoteId(note.id)} />)) : (<div className="flex flex-col items-center justify-center h-48 text-zinc-400"><Info size={32} strokeWidth={1} className="mb-2" /><p className="text-sm">Empty list</p></div>)}
        </div>
      </aside>

      {/* Editor Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        {activeNote ? (
          <>
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
               <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                <div className="flex items-center gap-1">{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.icon : '📂'}<span>/</span><span className="truncate max-w-[120px]">{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.name : 'Uncategorized'}</span></div>
                {saveStatus === 'saving' && <div className="text-zinc-400 animate-pulse">Saving...</div>}
                {saveStatus === 'saved' && <div className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> Saved</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStar(activeNote.id)} className={`p-2 rounded-lg ${activeNote.isStarred ? 'text-yellow-500' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}><Star size={18} fill={activeNote.isStarred ? 'currentColor' : 'none'} /></button>
                <button onClick={() => togglePin(activeNote.id)} className={`p-2 rounded-lg ${activeNote.isPinned ? 'text-blue-500' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}><Pin size={18} fill={activeNote.isPinned ? 'currentColor' : 'none'} /></button>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                {activeNote.isMarkdown ? (<button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isPreviewMode ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500'}`}>{isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}{isPreviewMode ? 'Edit' : 'Preview'}</button>) : (<button onClick={() => updateActiveNote({ isMarkdown: true })} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"><Code size={16} />Markdown</button>)}
                <button onClick={() => moveToTrash(activeNote.id)} className="p-2 hover:text-red-500 text-zinc-500"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 relative group">
              <div className={`mx-auto ${editorWidthClass} space-y-8 pb-32`}>
                {!isPreviewMode ? (
                  <>
                    <input type="text" value={activeNote.title} onChange={(e) => updateActiveNote({ title: e.target.value })} placeholder="Title" className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100" />
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        {activeNote.tags.map(t => (
                          <span key={t} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs rounded-full flex items-center gap-1 group/tag">#{t}<button onClick={() => updateActiveNote({ tags: activeNote.tags.filter(tag => tag !== t) })} className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"><X size={10} /></button></span>
                        ))}
                        {isAddingTag ? (<input ref={tagInputRef} type="text" value={newTagValue} onChange={(e) => setNewTagValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} onBlur={handleAddTag} placeholder="tag..." className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs rounded-full outline-none w-24" />) : (<button onClick={() => setIsAddingTag(true)} className="px-2 py-1 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs rounded-full flex items-center gap-1 hover:border-zinc-400"><Plus size={10} /> Tag</button>)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"><Paperclip size={14}/> Add Media</button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="audio/*,video/*,image/*,application/pdf,application/msword,text/plain" />
                        <button onClick={handleOpenUrlModal} className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"><LinkIcon size={14}/> Add Link</button>
                      </div>
                    </div>
                    <textarea 
                      ref={textareaRef}
                      value={activeNote.content} 
                      onChange={(e) => updateActiveNote({ content: e.target.value })} 
                      onBlur={(e) => setLastSelectionStart(e.target.selectionStart)}
                      onClick={(e) => setLastSelectionStart((e.target as HTMLTextAreaElement).selectionStart)}
                      onKeyUp={(e) => setLastSelectionStart((e.target as HTMLTextAreaElement).selectionStart)}
                      placeholder="Start typing..." 
                      className={`w-full min-h-[60vh] bg-transparent border-none outline-none resize-none leading-relaxed text-zinc-800 dark:text-zinc-200 ${activeNote.isMarkdown ? 'mono' : ''} ${fontSizeClass}`} 
                    />
                  </>
                ) : (
                  <div className="relative">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-12 border-b border-zinc-100 dark:border-zinc-900 pb-6">{activeNote.title || 'Untitled'}</h1>
                    <div className={`prose prose-zinc dark:prose-invert max-w-none ${fontSizeClass}`}>
                      <MarkdownPreview content={activeNote.content} attachments={activeNote.attachments} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4 transition-colors"><div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-full"><FileText size={48} strokeWidth={1} /></div><div className="text-center font-medium">Select a note to start writing</div><button onClick={createNewNote} className="mt-4 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-full font-semibold hover:opacity-90 transition-all flex items-center gap-2"><Plus size={18} />New Note</button></div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components ---

const SidebarNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; collapsed?: boolean; onClick: () => void; }> = ({ icon, label, active, collapsed, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
    <span className="shrink-0">{icon}</span>{!collapsed && <span className="truncate">{label}</span>}
  </button>
);

const NoteListItem: React.FC<{ note: Note; active: boolean; onClick: () => void; }> = ({ note, active, onClick }) => (
  <div onClick={onClick} className={`group p-4 border-b border-zinc-100 dark:border-zinc-900 cursor-pointer transition-colors relative ${active ? 'bg-zinc-50 dark:bg-zinc-900' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'}`}>
    <div className="flex items-start justify-between mb-1">
      <h3 className={`font-semibold text-sm truncate pr-4 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{note.title || 'Untitled Note'}</h3>
      {note.isPinned && <Pin size={12} className="text-blue-500" fill="currentColor" />}
    </div>
    <p className="text-xs text-zinc-500 line-clamp-2 mb-2 leading-relaxed">
      {note.content.replace(/\[.*?\]\(att-.*?\)/g, '').replace(/[#*`]/g, '').trim() || 'No preview available'}
    </p>
    <div className="flex items-center justify-between mt-auto">
      <div className="flex gap-1">{note.tags.slice(0, 2).map(t => (<span key={t} className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">{t}</span>))}</div>
      <span className="text-[10px] text-zinc-400">{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
    </div>
    {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-zinc-900 dark:bg-zinc-100" />}
  </div>
);

const MarkdownPreview: React.FC<{ content: string; attachments: Attachment[] }> = ({ content, attachments }) => {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-4" />;

        // Handle clean ID references: [File: name](att-id)
        const referenceMatch = line.match(/^\[(File|Link): (.*?)\]\((att-.*?)\)$/);
        if (referenceMatch) {
          const typeLabel = referenceMatch[1];
          const name = referenceMatch[2];
          const attId = referenceMatch[3];
          const attachment = attachments.find(a => a.id === attId);

          if (attachment) {
            // Audio
            if (attachment.type === 'audio') {
              return (
                <div key={idx} className="my-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3"><Music size={14}/> {name}</div>
                  <audio controls className="w-full" src={attachment.url} />
                </div>
              );
            }
            // Video
            if (attachment.type === 'video') {
              return (
                <div key={idx} className="my-6 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest"><Film size={14}/> {name}</div>
                  <video controls className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl" src={attachment.url} />
                </div>
              );
            }
            // URL Link
            if (attachment.type === 'url') {
              return (
                <div key={idx} className="my-2 p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl transition-all group">
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-blue-500"><Globe size={18}/></div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{name}</div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-xs">{attachment.url}</div>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
                  </a>
                </div>
              );
            }
            // Document / Other File
            return (
              <div key={idx} className="my-6 flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl group/card shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover/card:text-zinc-900 dark:group-hover/card:text-zinc-100 transition-colors"><FileIcon size={24} /></div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Attached Document</div>
                    <div className="text-sm font-semibold">{name}</div>
                  </div>
                </div>
                <a href={attachment.url} download={name} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 transition-all"><Download size={14}/> Download</a>
              </div>
            );
          }
        }

        // Default Markdown Logic
        if (line.startsWith('# ')) return <h1 key={idx} className="text-4xl font-extrabold mt-12 mb-6 tracking-tight text-zinc-900 dark:text-zinc-100">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} className="text-3xl font-bold mt-10 mb-5 tracking-tight text-zinc-900 dark:text-zinc-100">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold mt-8 mb-4 tracking-tight text-zinc-900 dark:text-zinc-100">{line.slice(4)}</h3>;
        if (line.startsWith('> ')) return <blockquote key={idx} className="border-l-4 border-zinc-900 dark:border-zinc-100 pl-6 italic my-8 py-2 text-lg text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 rounded-r-xl">{line.slice(2)}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={idx} className="ml-6 list-disc mb-2 text-zinc-700 dark:text-zinc-300 leading-relaxed">{line.slice(2)}</li>;
        if (line.match(/^\d+\. /)) return <li key={idx} className="ml-6 list-decimal mb-2 text-zinc-700 dark:text-zinc-300 leading-relaxed">{line.replace(/^\d+\. /, '')}</li>;
        if (line.trim() === '---') return <hr key={idx} className="border-zinc-200 dark:border-zinc-800 my-12" />;

        const formattedLine = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900 dark:text-zinc-100">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm mono text-rose-500 dark:text-rose-400">$1</code>')
          .replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
             // Basic check to avoid breaking our custom ID references
             if (url.startsWith('att-')) return match; 
             return `<a href="${url}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">${text}</a>`;
          });

        return <p key={idx} className="leading-relaxed mb-4 text-zinc-700 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />;
      })}
    </div>
  );
};

export default App;
