
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FileText, 
  Star, 
  Trash2, 
  Settings, 
  Search, 
  Plus, 
  Tag, 
  Pin, 
  Layout, 
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
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { Note, Folder, ViewMode, AppSettings, Attachment } from './types';
import { INITIAL_NOTES, INITIAL_FOLDERS, APP_ID } from './constants';

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
  const [folders] = useState<Folder[]>(() => {
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<Attachment | null>(null);
  
  // UI states
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState('');
  const [lastSelectionStart, setLastSelectionStart] = useState<number>(0);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-settings`);
      return saved ? JSON.parse(saved) : {
        theme: 'light',
        fontSize: 'base',
        editorWidth: 'standard'
      };
    } catch (e) {
      return { theme: 'light', fontSize: 'base', editorWidth: 'standard' };
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  // --- Effects ---
  useEffect(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(`${APP_ID}-notes`, JSON.stringify(notes));
      const timer = setTimeout(() => setSaveStatus('saved'), 600);
      return () => clearTimeout(timer);
    } catch (e) {
      setSaveStatus('error');
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(`${APP_ID}-settings`, JSON.stringify(settings));
    } catch (e) {}
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, [settings]);

  useEffect(() => {
    setIsPreviewMode(false);
    setIsAddingTag(false);
    setShowUrlModal(false);
  }, [activeNoteId]);

  useEffect(() => { if (isAddingTag && tagInputRef.current) tagInputRef.current.focus(); }, [isAddingTag]);
  useEffect(() => { if (showUrlModal && urlInputRef.current) urlInputRef.current.focus(); }, [showUrlModal]);

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
  }, [currentView]);

  const updateActiveNote = useCallback((updates: Partial<Note>) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: Date.now() } : n));
  }, [activeNoteId]);

  // Added handleAddTag handler to fix missing function error
  const handleAddTag = useCallback(() => {
    if (newTagValue.trim() && activeNote) {
      const tag = newTagValue.trim().toLowerCase();
      if (!activeNote.tags.includes(tag)) {
        updateActiveNote({ tags: [...activeNote.tags, tag] });
      }
    }
    setNewTagValue('');
    setIsAddingTag(false);
  }, [newTagValue, activeNote, updateActiveNote]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !activeNoteId) return;

    // Safety check for localStorage quota
    const MAX_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5MB
    const initialPos = textareaRef.current ? textareaRef.current.selectionStart : 0;
    
    try {
      setSaveStatus('saving');
      const results = await Promise.all(files.map(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File "${file.name}" exceeds the 2.5MB limit for local storage. Skipping.`);
          return null;
        }
        return new Promise<{ attachment: Attachment, insertText: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            let type: Attachment['type'] = 'document';
            if (file.type.startsWith('audio/')) type = 'audio';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('image/')) type = 'image';
            
            const id = `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            resolve({
              attachment: { id, name: file.name, type, url: base64, size: file.size },
              insertText: `\n[File: ${file.name}](${id})\n`
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      const validResults = results.filter((r): r is { attachment: Attachment, insertText: string } => r !== null);
      if (validResults.length === 0) return;

      const newAttachments = validResults.map(r => r.attachment);
      const combinedInsertText = validResults.map(r => r.insertText).join("");

      setNotes(prev => prev.map(n => n.id === activeNoteId ? {
        ...n,
        attachments: [...n.attachments, ...newAttachments],
        content: n.content.substring(0, initialPos) + combinedInsertText + n.content.substring(initialPos),
        updatedAt: Date.now()
      } : n));
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    } finally {
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!activeNote || !newUrlValue.trim()) return;
    const url = newUrlValue.trim().startsWith('http') ? newUrlValue.trim() : `https://${newUrlValue.trim()}`;
    const id = `att-${Date.now()}`;
    const attachment: Attachment = { id, name: 'Web Link', type: 'url', url };
    const reference = `\n[Link: ${url}](${id})\n`;
    const pos = textareaRef.current ? textareaRef.current.selectionStart : activeNote.content.length;
    
    updateActiveNote({
      attachments: [...activeNote.attachments, attachment],
      content: activeNote.content.substring(0, pos) + reference + activeNote.content.substring(pos)
    });
    setNewUrlValue('');
    setShowUrlModal(false);
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
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between shrink-0">
          {!isSidebarCollapsed && <div className="font-bold text-xl tracking-tighter">Super Notes</div>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500"><Menu size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          <SidebarNavItem icon={<FileText size={18} />} label="All Notes" active={currentView.mode === ViewMode.All} collapsed={isSidebarCollapsed} onClick={() => setCurrentView({ mode: ViewMode.All })} />
          <SidebarNavItem icon={<Star size={18} />} label="Starred" active={currentView.mode === ViewMode.Starred} collapsed={isSidebarCollapsed} onClick={() => setCurrentView({ mode: ViewMode.Starred })} />
          <SidebarNavItem icon={<Trash2 size={18} />} label="Trash" active={currentView.mode === ViewMode.Trash} collapsed={isSidebarCollapsed} onClick={() => setCurrentView({ mode: ViewMode.Trash })} />
          {!isSidebarCollapsed && (
            <>
              <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Folders</div>
              {folders.map(f => (<SidebarNavItem key={f.id} icon={<span>{f.icon}</span>} label={f.name} active={currentView.mode === ViewMode.Folder && currentView.id === f.id} onClick={() => setCurrentView({ mode: ViewMode.Folder, id: f.id })} />))}
              <div className="pt-6 pb-2 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tags</div>
              <div className="px-2 space-y-1">
                {allTags.map(tag => (<SidebarNavItem key={tag} icon={<Tag size={14} />} label={tag} active={currentView.mode === ViewMode.Tag && currentView.id === tag} onClick={() => setCurrentView({ mode: ViewMode.Tag, id: tag })} />))}
              </div>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500">{settings.theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"><Settings size={20}/></button>
        </div>
      </aside>

      {/* Explorer */}
      <aside className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="font-semibold capitalize text-sm">{currentView.mode}</h2>
          <button onClick={createNewNote} className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"><Plus size={18} /></button>
        </div>
        <div className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input type="text" placeholder="Filter notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg outline-none text-xs" /></div></div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length > 0 ? filteredNotes.map(note => (<NoteListItem key={note.id} note={note} active={activeNoteId === note.id} onClick={() => setActiveNoteId(note.id)} />)) : (<div className="flex flex-col items-center justify-center h-48 text-zinc-400"><Info size={24} className="mb-2" /><p className="text-xs">No notes found</p></div>)}
        </div>
      </aside>

      {/* Editor/Reader Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        {activeNote ? (
          <>
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
               <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-1"><span>{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.name : 'Drafts'}</span></div>
                {saveStatus === 'saving' && <div className="animate-pulse">Saving...</div>}
                {saveStatus === 'saved' && <div className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> Saved</div>}
                {saveStatus === 'error' && <div className="text-red-500 flex items-center gap-1 font-bold">Storage Full!</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStar(activeNote.id)} className={`p-2 rounded-lg transition-colors ${activeNote.isStarred ? 'text-yellow-500' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Star size={18} fill={activeNote.isStarred ? 'currentColor' : 'none'} /></button>
                <button onClick={() => togglePin(activeNote.id)} className={`p-2 rounded-lg transition-colors ${activeNote.isPinned ? 'text-blue-500' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Pin size={18} fill={activeNote.isPinned ? 'currentColor' : 'none'} /></button>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                <button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPreviewMode ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                  {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                  {isPreviewMode ? 'Edit' : 'Read Mode'}
                </button>
                <button onClick={() => moveToTrash(activeNote.id)} className="p-2 hover:text-red-500 text-zinc-400"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 relative">
              <div className={`mx-auto ${editorWidthClass} space-y-8 pb-32`}>
                {!isPreviewMode ? (
                  <>
                    <input type="text" value={activeNote.title} onChange={(e) => updateActiveNote({ title: e.target.value })} placeholder="Note Title..." className="w-full text-4xl md:text-5xl font-extrabold bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-200 dark:placeholder:text-zinc-800" />
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        {activeNote.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-[10px] font-bold rounded-full flex items-center gap-1 group/tag">#{t}<button onClick={() => updateActiveNote({ tags: activeNote.tags.filter(tag => tag !== t) })} className="hover:text-red-500 transition-colors opacity-0 group-hover/tag:opacity-100"><X size={10} /></button></span>
                        ))}
                        {isAddingTag ? (<input ref={tagInputRef} type="text" value={newTagValue} onChange={e => setNewTagValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} onBlur={handleAddTag} placeholder="..." className="px-2 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none w-16 text-[10px]" />) : (<button onClick={() => setIsAddingTag(true)} className="px-2 py-0.5 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[10px] rounded-full hover:border-zinc-400 transition-colors"><Plus size={10} /> Tag</button>)}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"><Paperclip size={14}/> Add File</button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                        <button onClick={() => setShowUrlModal(true)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"><LinkIcon size={14}/> Web Link</button>
                      </div>
                    </div>
                    <textarea 
                      ref={textareaRef}
                      value={activeNote.content} 
                      onChange={(e) => updateActiveNote({ content: e.target.value })} 
                      placeholder="Start capturing your thoughts..." 
                      className={`w-full min-h-[60vh] bg-transparent border-none outline-none resize-none leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-200 dark:placeholder:text-zinc-800 ${fontSizeClass}`} 
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
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
    <span className="shrink-0">{icon}</span>{!collapsed && <span className="truncate">{label}</span>}
  </button>
);

const NoteListItem: React.FC<{ note: Note; active: boolean; onClick: () => void; }> = ({ note, active, onClick }) => (
  <div onClick={onClick} className={`group p-4 border-b border-zinc-100 dark:border-zinc-900 cursor-pointer transition-colors relative ${active ? 'bg-zinc-50 dark:bg-zinc-900' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'}`}>
    <div className="flex items-start justify-between mb-1">
      <h3 className={`font-bold text-sm truncate pr-4 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{note.title || 'Untitled'}</h3>
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
  const cardClasses = "my-6 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl group transition-all duration-300";

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
 * Clean Reading View component (formerly MarkdownPreview).
 */
const NoteReadingView: React.FC<{ title: string; content: string; attachments: Attachment[]; onImageClick: (att: Attachment) => void }> = ({ title, content, attachments, onImageClick }) => {
  const lines = content.split('\n');
  
  return (
    <div className="relative">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-12 pb-6 border-b border-zinc-100 dark:border-zinc-900">{title || 'Untitled Note'}</h1>
      <div className="space-y-4">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-4" />;

          // Detect attachment markers: [File: name](att-id)
          const attachmentMatch = line.match(/^\[(File|Link): (.*?)\]\((att-.*?)\)$/);
          if (attachmentMatch) {
            const attId = attachmentMatch[3];
            const attachment = attachments.find(a => a.id === attId);
            if (attachment) {
              return <AttachmentRenderer key={idx} attachment={attachment} onImageClick={onImageClick} />;
            }
          }

          // Simple non-markdown rendering
          return <p key={idx} className="leading-relaxed text-zinc-700 dark:text-zinc-300 text-lg">{line}</p>;
        })}
      </div>
    </div>
  );
};

export default App;