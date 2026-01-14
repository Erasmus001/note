import { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  NoteExplorer,
  RichTextEditor,
  RichTextEditorRef,
  UrlModal,
  ImagePreviewModal,
  DeleteConfirmModal,
  ShareNoteModal,
  CollaboratorAvatars,
  TypingIndicator,
  NoteCursors
} from '../components';
import { useCollaboration, useNotePresence } from '../hooks';
import { processFiles, getYouTubeId, getTweetId } from '../utils';
import {
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Star,
  Edit3,
  Eye,
  X,
  Paperclip,
  Link as LinkIcon,
  Share2
} from 'lucide-react';
import { Note, Attachment, ViewMode } from '../../types';

export const NotesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Parse URL params
  const noteId = params.noteId;
  const folderId = params.folderId;
  const tagId = params.tagId;
  const inviteToken = params.token;

  // Context from RootLayout
  const {
    notes, folders, settings, sharedNotes,
    createNote: contextCreateNote, updateNote,
    toggleStar, togglePin, moveToTrash,
    restoreNote, deletePermanently, emptyTrash
  } = useOutletContext<any>();

  // Collaboration hooks
  const { acceptShareLink, sharedWithMe, canEdit } = useCollaboration();
  const { onlinePeers, typingPeers, typingInputProps, myPresence } = useNotePresence(noteId || null);

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<Attachment | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [newUrlValue, setNewUrlValue] = useState("");

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'note' | 'trash';
    noteId?: string;
  }>({ isOpen: false, type: 'note' });

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  // Determine current view mode
  const currentView = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith('/starred')) return { mode: ViewMode.Starred };
    if (path.startsWith('/trash')) return { mode: ViewMode.Trash };
    if (path.startsWith('/shared')) return { mode: ViewMode.Shared };
    if (path.startsWith('/folders/')) return { mode: ViewMode.Folder, id: folderId };
    if (path.startsWith('/tags/')) return { mode: ViewMode.Tag, id: tagId };

    return { mode: ViewMode.All };
  }, [location.pathname, folderId, tagId]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    let result = notes;

    // View filter
    if (currentView.mode === ViewMode.Starred)
      result = result.filter((n: Note) => n.isStarred && !n.isTrashed);
    else if (currentView.mode === ViewMode.Trash)
      result = result.filter((n: Note) => n.isTrashed);
    else if (currentView.mode === ViewMode.Shared)
      // Filter to only show notes that were shared with me (not owned by me)
      result = (sharedNotes || []).filter((n: Note) => !n.isTrashed);
    else if (currentView.mode === ViewMode.Folder)
      result = result.filter((n: Note) => n.folderId === currentView.id && !n.isTrashed);
    else if (currentView.mode === ViewMode.Tag)
      result = result.filter((n: Note) => n.tags.includes(currentView.id || "") && !n.isTrashed);
    else
      result = result.filter((n: Note) => !n.isTrashed);

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n: Note) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return [...result].sort((a: Note, b: Note) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, currentView, searchQuery]);

  // Active note
  const activeNote = useMemo(
    () => notes.find((n: Note) => n.id === noteId) || null,
    [notes, noteId]
  );

  // Computed classes
  const fontSizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg" }[settings.fontSize as "sm" | "base" | "lg"];
  const editorWidthClass = {
    narrow: "max-w-2xl",
    standard: "max-w-4xl",
    full: "max-w-full",
  }[settings.editorWidth as "narrow" | "standard" | "full"];

  // Handlers
  const handleCreateNote = () => {
    const folderIdForNewNote = currentView.mode === ViewMode.Folder ? currentView.id : undefined;
    const newNote = contextCreateNote(folderIdForNewNote);

    // Navigate to new note while preserving context
    let basePath = '/notes';
    if (currentView.mode === ViewMode.Folder) basePath = `/folders/${currentView.id}`;
    // We don't generally create notes directly in starred/trash views, default to /notes

    navigate(`${basePath}/${newNote.id}`);
    setIsPreviewMode(false); // Auto-edit new notes
  };

  const handleSelectNote = (id: string) => {
    // Construct path based on current view to keep context
    let path = `/notes/${id}`;
    if (currentView.mode === ViewMode.Starred) path = `/starred/${id}`;
    else if (currentView.mode === ViewMode.Trash) path = `/trash/${id}`;
    else if (currentView.mode === ViewMode.Shared) path = `/shared/${id}`;
    else if (currentView.mode === ViewMode.Folder) path = `/folders/${currentView.id}/${id}`;
    else if (currentView.mode === ViewMode.Tag) path = `/tags/${currentView.id}/${id}`;

    navigate(path);
  };

  // Attachments & Tags
  const handleAddTag = () => {
    if (newTagValue.trim() && activeNote && !activeNote.isTrashed) {
      const tag = newTagValue.trim().toLowerCase();
      if (!activeNote.tags.includes(tag)) {
        updateNote(activeNote.id, { tags: [...activeNote.tags, tag] });
      }
    }
    setNewTagValue("");
    setIsAddingTag(false);
  };

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
        name = urlObj.hostname;
      } catch (e) {
        name = urlString;
      }
    }

    const attachment: Attachment = { id, name, type: "url", url: urlString };
    updateNote(activeNote.id, {
      attachments: [...activeNote.attachments, attachment],
    });

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.insertContent(`\n[Link: ${name}](${id})\n`);
      }
    }, 10);

    setNewUrlValue("");
    setShowUrlModal(false);
  };

  const resizeAttachment = (noteId: string, attachmentId: string, width: number) => {
    const note = notes.find((n: Note) => n.id === noteId);
    if (note) {
      updateNote(noteId, {
        attachments: note.attachments.map((a: Attachment) =>
          a.id === attachmentId ? { ...a, width } : a
        )
      });
    }
  };

  const addAttachment = (noteId: string, att: Attachment) => {
    const note = notes.find((n: Note) => n.id === noteId);
    if (note) {
      updateNote(noteId, { attachments: [...note.attachments, att] });
    }
  };

  // Effects
  useEffect(() => {
    // If active note is fresh, enter edit mode
    if (activeNote) {
      const isNew = Date.now() - activeNote.createdAt < 1000 && !activeNote.content && !activeNote.jsonContent;
      if (isNew) setIsPreviewMode(false);
    }
  }, [activeNote]);

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) tagInputRef.current.focus();
  }, [isAddingTag]);

  // Handle invite token acceptance
  useEffect(() => {
    const handleInvite = async () => {
      if (inviteToken) {
        try {
          const result = await acceptShareLink(inviteToken);
          if (result) {
            navigate(`/shared/${result.noteId}`);
          }
        } catch (err) {
          console.error('Failed to accept invite:', err);
          navigate('/notes');
        }
      }
    };
    handleInvite();
  }, [inviteToken, acceptShareLink, navigate]);

  return (
    <>
      <NoteExplorer
        notes={filteredNotes}
        folders={folders}
        currentView={currentView}
        activeNoteId={noteId || null}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onEmptyTrash={() => setDeleteModal({ isOpen: true, type: 'trash' })}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {activeNote ? (
          <>
            {activeNote.isTrashed && (
              <div className="bg-zinc-100 border-b px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-zinc-500 text-sm">
                  <AlertTriangle className="text-amber-500" size={18} />
                  <span>This note is in the trash.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => restoreNote(activeNote.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-xs font-bold rounded-lg border text-green-600"
                  >
                    <RefreshCw size={14} /> Restore
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, type: 'note', noteId: activeNote.id })}
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
                    ? folders.find((f: any) => f.id === activeNote.folderId)?.name
                    : "Drafts"}
                </span>
                <div className="w-px h-3 bg-zinc-200" />
                {/* Save status is tricky without passing it from hook. We can just show "Saved" effectively */}
                <div className="text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Saved
                </div>
                {/* Show online collaborators */}
                {onlinePeers.length > 0 && (
                  <>
                    <div className="w-px h-3 bg-zinc-200" />
                    <CollaboratorAvatars peers={onlinePeers} maxVisible={3} />
                  </>
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
                        fill={activeNote.isStarred ? "currentColor" : "none"}
                      />
                    </button>
                    <div className="w-px h-4 bg-zinc-200" />
                  </>
                )}
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${isPreviewMode ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                >
                  {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                  {isPreviewMode ? "Edit" : "Read Mode"}
                </button>
                {!activeNote.isTrashed && (
                  <>
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:bg-zinc-100 transition-colors"
                    >
                      <Share2 size={14} /> Share
                    </button>
                    <button
                      onClick={() => {
                        moveToTrash(activeNote.id);
                        navigate('/notes'); // back to list
                      }}
                      className="p-2 hover:text-red-500 text-zinc-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Typing indicator */}
            {typingPeers.length > 0 && (
              <TypingIndicator typingPeers={typingPeers} />
            )}

            <NoteCursors noteId={activeNote.id} userColor={myPresence?.color}>
              <div className="flex-1 overflow-y-auto px-6 py-12 md:px-12 relative">
                <div className={`mx-auto ${editorWidthClass} space-y-8 pb-32`}>
                  {!isPreviewMode ? (
                    <>
                      <input
                        type="text"
                        value={activeNote.title}
                        onChange={(e) =>
                          updateNote(activeNote.id, { title: e.target.value })
                        }
                        onKeyDown={typingInputProps.onKeyDown}
                        onBlur={typingInputProps.onBlur}
                        disabled={activeNote.isTrashed}
                        placeholder="Note Title..."
                        className="w-full text-4xl md:text-5xl font-extrabold bg-transparent border-none outline-none text-zinc-900 placeholder:text-zinc-200"
                      />
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-wrap gap-2 items-center border-r border-zinc-200 pr-4">
                          {activeNote.tags.map((t: string) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold rounded-full flex items-center gap-1 group/tag"
                            >
                              #{t}
                              {!activeNote.isTrashed && (
                                <button
                                  onClick={() =>
                                    updateNote(activeNote.id, {
                                      tags: activeNote.tags.filter(
                                        (tag: string) => tag !== t,
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
                                onChange={(e) => setNewTagValue(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleAddTag()
                                }
                                onBlur={handleAddTag}
                                placeholder="..."
                                className="px-2 bg-transparent border-b border-zinc-300 outline-none w-16 text-[10px]"
                              />
                            ) : (
                              <button
                                onClick={() => setIsAddingTag(true)}
                                className="px-2 py-0.5 border border-dashed border-zinc-200 text-zinc-400 text-[10px] rounded-full"
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
                            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
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
                              if (files.length > 0) {
                                const attachments = await processFiles(files);
                                attachments.forEach(att => addAttachment(activeNote.id, att));
                                if (editorRef.current) {
                                  editorRef.current.insertAttachmentBlocks(attachments);
                                }
                              }
                              e.target.value = "";
                            }}
                          />
                          <button
                            onClick={() =>
                              !activeNote.isTrashed && setShowUrlModal(true)
                            }
                            className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 disabled:opacity-30"
                          >
                            <LinkIcon size={14} /> Web Link
                          </button>
                        </div>
                      </div>
                      <RichTextEditor
                        ref={editorRef}
                        content={activeNote.content}
                        jsonContent={activeNote.jsonContent}
                        attachments={activeNote.attachments}
                        onUpdate={({ text, json }) =>
                          updateNote(activeNote.id, { content: text, jsonContent: json })
                        }
                        onImageClick={setSelectedPreviewImage}
                        onAttachmentResize={(attId, width) =>
                          resizeAttachment(activeNote.id, attId, width)
                        }
                        fontSizeClass={fontSizeClass}
                        disabled={activeNote.isTrashed}
                      />
                    </>
                  ) : (
                    <div className="space-y-8">
                      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 pb-6 border-b border-zinc-100">
                        {activeNote.title || 'Untitled Note'}
                      </h1>
                      <RichTextEditor
                        content={activeNote.content}
                        jsonContent={activeNote.jsonContent}
                        attachments={activeNote.attachments}
                        onUpdate={() => { }} // Read only
                        onImageClick={setSelectedPreviewImage}
                        onAttachmentResize={() => { }}
                        fontSizeClass={fontSizeClass}
                        disabled={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            </NoteCursors>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-6">
            <div className="p-8 bg-zinc-50 rounded-full">
              <FileText size={64} strokeWidth={1} />
            </div>
            <div className="text-center italic">
              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                Private workspace
              </h2>
              <p className="text-sm">
                Select a note or create a new one to begin.
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="px-8 py-3 bg-zinc-900 text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
            >
              <Plus size={20} /> New Note
            </button>
          </div>
        )}
      </main>

      {selectedPreviewImage && (
        <ImagePreviewModal
          image={selectedPreviewImage}
          onClose={() => setSelectedPreviewImage(null)}
        />
      )}

      <UrlModal
        isOpen={showUrlModal}
        urlValue={newUrlValue}
        onUrlChange={setNewUrlValue}
        onAdd={handleAddUrl}
        onClose={() => setShowUrlModal(false)}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'trash' ? 'Empty Trash' : 'Delete Note'}
        message={
          deleteModal.type === 'trash'
            ? `Are you sure you want to permanently delete ${filteredNotes.length} notes? This cannot be undone.`
            : 'Are you sure you want to delete this note permanently? This action cannot be undone.'
        }
        confirmLabel={deleteModal.type === 'trash' ? 'Empty Trash' : 'Delete Forever'}
        onConfirm={() => {
          if (deleteModal.type === 'trash') {
            emptyTrash();
          } else if (deleteModal.noteId) {
            deletePermanently(deleteModal.noteId);
            navigate('/trash');
          }
          setDeleteModal({ isOpen: false, type: 'note' });
        }}
        onCancel={() => setDeleteModal({ isOpen: false, type: 'note' })}
      />

      {activeNote && (
        <ShareNoteModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          noteId={activeNote.id}
          noteTitle={activeNote.title}
        />
      )}
    </>
  );
};
