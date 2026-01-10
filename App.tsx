
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
  Download
} from 'lucide-react';
import { Note, Folder, ViewMode, AppSettings, Attachment } from './types';
import { INITIAL_NOTES, INITIAL_FOLDERS, APP_ID } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(`${APP_ID}-notes`);
    const parsed = saved ? JSON.parse(saved) : INITIAL_NOTES;
    // Migrate old notes if attachments field is missing
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
  
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

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
    setIsAddingUrl(false);
    setNewTagValue('');
    setNewUrlValue('');
  }, [activeNoteId]);

  useEffect(() => { if (isAddingTag && tagInputRef.current) tagInputRef.current.focus(); }, [isAddingTag]);
  useEffect(() => { if (isAddingUrl && urlInputRef.current) urlInputRef.current.focus(); }, [isAddingUrl]);

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
      readTime: 0
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  }, [settings.defaultMarkdown]);

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

  const handleAddUrl = () => {
    if (!activeNote || !newUrlValue.trim()) {
      setIsAddingUrl(false);
      return;
    }
    const url = newUrlValue.trim();
    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      name: url.split('/').pop() || 'Linked Resource',
      type: 'url',
      url: url
    };
    updateActiveNote({ attachments: [...activeNote.attachments, newAttachment] });
    setNewUrlValue('');
    setIsAddingUrl(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeNote) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const type: Attachment['type'] = file.type.startsWith('audio/') ? 'audio' : 
                                     file.type.startsWith('video/') ? 'video' : 'document';
      
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: type,
        url: base64,
        size: file.size
      };
      updateActiveNote({ attachments: [...activeNote.attachments, newAttachment] });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
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
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden">
      {/* Primary Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center text-white dark:text-black">
                <Layout size={18} />
              </div>
              <span>Super Notes</span>
            </div>
          )}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded"><Menu size={18} /></button>
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
          {!isSidebarCollapsed && <div className="flex items-center gap-2 text-xs text-green-500 mb-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>Synced with Cloud</div>}
          <div className="flex items-center justify-between">
            <button onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }))} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500">{settings.theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}</button>
            {!isSidebarCollapsed && <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500"><Settings size={20}/></button>}
          </div>
        </div>
      </aside>

      {/* Secondary Sidebar */}
      <aside className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold capitalize">{currentView.mode} {currentView.id ? ` - ${currentView.id}` : ''}</h2>
          <button onClick={createNewNote} className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-lg hover:opacity-90"><Plus size={18} /></button>
        </div>
        <div className="px-4 py-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} /><input type="text" placeholder="Quick find notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg focus:ring-1 focus:ring-zinc-400 outline-none text-sm transition-all" /></div></div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length > 0 ? filteredNotes.map(note => (<NoteListItem key={note.id} note={note} active={activeNoteId === note.id} onClick={() => setActiveNoteId(note.id)} />)) : (<div className="flex flex-col items-center justify-center h-48 text-zinc-400"><Info size={32} strokeWidth={1} className="mb-2" /><p className="text-sm">No notes found</p></div>)}
        </div>
      </aside>

      {/* Main Editor Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950">
        {activeNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                <div className="flex items-center gap-1 cursor-default">{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.icon : '📂'}<span>/</span><span className="truncate max-w-[120px]">{activeNote.folderId ? folders.find(f => f.id === activeNote.folderId)?.name : 'Uncategorized'}</span></div>
                {activeNote.readTime > 0 && <div className="hidden sm:flex items-center gap-1 text-zinc-400"><Clock size={12} /><span>{activeNote.readTime} min read</span></div>}
                <div className="flex items-center gap-1.5 transition-all duration-300">
                  {saveStatus === 'saving' ? (<div className="flex items-center gap-1.5 text-zinc-400 animate-pulse"><CloudUpload size={12} className="animate-bounce" /><span>Saving...</span></div>) : saveStatus === 'saved' ? (<div className="flex items-center gap-1.5 text-green-500/80"><CheckCircle2 size={12} /><span>Saved</span></div>) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStar(activeNote.id)} className={`p-2 rounded-lg transition-colors ${activeNote.isStarred ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500'}`} title="Toggle Star"><Star size={18} fill={activeNote.isStarred ? 'currentColor' : 'none'} /></button>
                <button onClick={() => togglePin(activeNote.id)} className={`p-2 rounded-lg transition-colors ${activeNote.isPinned ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500'}`} title="Toggle Pin"><Pin size={18} fill={activeNote.isPinned ? 'currentColor' : 'none'} /></button>
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                {activeNote.isMarkdown ? (<button onClick={() => setIsPreviewMode(!isPreviewMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isPreviewMode ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500'}`}>{isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}{isPreviewMode ? 'Edit' : 'Preview'}</button>) : (<button onClick={() => updateActiveNote({ isMarkdown: true })} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"><Code size={16} />Markdown</button>)}
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500"><Share2 size={18} /></button>
                <button onClick={() => moveToTrash(activeNote.id)} className="p-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 rounded-lg text-zinc-500"><Trash2 size={18} /></button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 relative group">
              <div className={`mx-auto ${editorWidthClass} space-y-8 pb-24`}>
                {!isPreviewMode ? (
                  <>
                    <input type="text" value={activeNote.title} onChange={(e) => updateActiveNote({ title: e.target.value })} placeholder="Note Title" className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 tracking-tight" />
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 dark:border-zinc-800 pr-4">
                        {activeNote.tags.map(t => (
                          <span key={t} className="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs rounded-full flex items-center gap-1 group/tag">
                            #{t}<button onClick={() => updateActiveNote({ tags: activeNote.tags.filter(tag => tag !== t) })} className="hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"><X size={10} /></button>
                          </span>
                        ))}
                        {isAddingTag ? (<input ref={tagInputRef} type="text" value={newTagValue} onChange={(e) => setNewTagValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} onBlur={handleAddTag} placeholder="tag name..." className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs rounded-full outline-none w-24" />) : (<button onClick={() => setIsAddingTag(true)} className="px-2 py-1 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs rounded-full flex items-center gap-1 hover:border-zinc-400 transition-colors"><Plus size={10} /> Tag</button>)}
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"><Paperclip size={14}/> Attach File</button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="audio/*,video/*,application/pdf,application/msword,text/plain" />
                        
                        {isAddingUrl ? (
                          <input ref={urlInputRef} type="text" value={newUrlValue} onChange={(e) => setNewUrlValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()} onBlur={handleAddUrl} placeholder="Paste URL..." className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs rounded-lg outline-none w-40" />
                        ) : (
                          <button onClick={() => setIsAddingUrl(true)} className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"><LinkIcon size={14}/> Add Link</button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activeNote.attachments.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-900">
                          {activeNote.attachments.map(att => (
                            <AttachmentCard key={att.id} attachment={att} onRemove={() => removeAttachment(att.id)} />
                          ))}
                        </div>
                      )}
                      <textarea value={activeNote.content} onChange={(e) => updateActiveNote({ content: e.target.value })} placeholder="Write something brilliant..." className={`w-full min-h-[50vh] bg-transparent border-none outline-none resize-none leading-relaxed ${activeNote.isMarkdown ? 'mono' : ''} ${fontSizeClass}`} />
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-900">
                      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{activeNote.title || 'Untitled Note'}</h1>
                      <button onClick={() => setIsPreviewMode(false)} className="opacity-0 group-hover:opacity-100 transition-opacity absolute -right-4 top-0 flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-semibold shadow-sm"><Edit3 size={14} />Edit Source</button>
                    </div>

                    <div className="mb-10 space-y-6">
                      {activeNote.attachments.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                          {activeNote.attachments.map(att => (
                            <PreviewAttachment key={att.id} attachment={att} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`prose prose-zinc dark:prose-invert max-w-none ${fontSizeClass}`}>
                      <MarkdownPreview content={activeNote.content || '*No content yet...*'} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="h-10 border-t border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-widest font-medium shrink-0 bg-white dark:bg-zinc-950">
              <div className="flex items-center gap-4"><span>Last Edited {new Date(activeNote.updatedAt).toLocaleTimeString()}</span><span>{activeNote.content.split(/\s+/).filter(x => x).length} Words</span></div>
              <div className="flex items-center gap-4"><button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Revision History</button><button className="hover:text-zinc-900 dark:hover:text-white transition-colors">Collaborators</button></div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 space-y-4"><div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-full"><FileText size={48} strokeWidth={1} /></div><div className="text-center"><h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Select a note to read</h3><p className="max-w-xs mt-1 text-sm">Capture thoughts, organize ideas, and build your personal knowledge base.</p></div><button onClick={createNewNote} className="mt-4 px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-full font-semibold hover:opacity-90 transition-all flex items-center gap-2"><Plus size={18} />Create New Note</button></div>
        )}
      </main>
    </div>
  );
};

// --- Sub-components ---

const AttachmentCard: React.FC<{ attachment: Attachment; onRemove: () => void }> = ({ attachment, onRemove }) => {
  const Icon = attachment.type === 'audio' ? Music : 
                attachment.type === 'video' ? Film : 
                attachment.type === 'url' ? LinkIcon : File;

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 group/att shadow-sm">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-md text-zinc-600 dark:text-zinc-400"><Icon size={16} /></div>
        <div className="overflow-hidden">
          <p className="text-xs font-medium truncate text-zinc-900 dark:text-zinc-100">{attachment.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase">{attachment.type}</p>
        </div>
      </div>
      <button onClick={onRemove} className="p-1 hover:text-red-500 opacity-0 group-hover/att:opacity-100 transition-opacity"><X size={14} /></button>
    </div>
  );
};

const PreviewAttachment: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  if (attachment.type === 'audio') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider"><Music size={14}/> Audio Recording: {attachment.name}</div>
        <audio controls className="w-full h-10 rounded-lg shadow-sm focus:outline-none" src={attachment.url} />
      </div>
    );
  }
  
  if (attachment.type === 'video') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider"><Film size={14}/> Video Clip: {attachment.name}</div>
        <video controls className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg" src={attachment.url} />
      </div>
    );
  }

  return (
    <a 
      href={attachment.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white dark:bg-zinc-950 rounded-lg text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
          {attachment.type === 'url' ? <LinkIcon size={20} /> : <FileText size={20} />}
        </div>
        <div>
          <p className="font-semibold text-sm group-hover:text-zinc-900 dark:group-hover:text-white">{attachment.name}</p>
          <p className="text-xs text-zinc-500 truncate max-w-xs">{attachment.url}</p>
        </div>
      </div>
      <ExternalLink size={16} className="text-zinc-400" />
    </a>
  );
};

const SidebarNavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; collapsed?: boolean; onClick: () => void; }> = ({ icon, label, active, collapsed, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium shadow-sm' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
    <span className="shrink-0">{icon}</span>{!collapsed && <span className="truncate">{label}</span>}
  </button>
);

const NoteListItem: React.FC<{ note: Note; active: boolean; onClick: () => void; }> = ({ note, active, onClick }) => (
  <div onClick={onClick} className={`group p-4 border-b border-zinc-100 dark:border-zinc-900 cursor-pointer transition-colors relative ${active ? 'bg-zinc-50 dark:bg-zinc-900' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'}`}>
    <div className="flex items-start justify-between mb-1">
      <h3 className={`font-semibold text-sm truncate pr-4 ${active ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{note.title || 'Untitled Note'}</h3>
      {note.isPinned && <Pin size={12} className="text-blue-500 shrink-0" fill="currentColor" />}
    </div>
    <p className="text-xs text-zinc-500 line-clamp-2 mb-2 leading-relaxed">{note.content.replace(/[#*`]/g, '') || 'No additional content'}</p>
    <div className="flex items-center justify-between mt-auto">
      <div className="flex gap-1 overflow-hidden">{note.tags.slice(0, 2).map(t => (<span key={t} className="text-[10px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">{t}</span>))}{note.tags.length > 2 && <span className="text-[10px] text-zinc-400">+{note.tags.length - 2}</span>}</div>
      <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">{new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
    </div>
    {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-zinc-900 dark:bg-zinc-100" />}
  </div>
);

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold mt-4 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith('> ')) return <blockquote key={idx} className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-4 py-2 text-zinc-600 dark:text-zinc-400">{line.slice(2)}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={idx} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (line.match(/^\d+\. /)) return <li key={idx} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        if (line.trim() === '---') return <hr key={idx} className="border-zinc-200 dark:border-zinc-800 my-8" />;
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-sm mono">$1</code>');
        return <p key={idx} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }} />;
      })}
    </div>
  );
};

export default App;
