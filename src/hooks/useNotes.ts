import { useState, useEffect, useMemo, useCallback } from "react";
import { Note, ViewMode, Attachment } from "../../types";
import { INITIAL_NOTES, APP_ID } from "../../constants";

export const useNotes = (
  currentView: { mode: ViewMode; id?: string },
  searchQuery: string,
) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_ID}-notes`);
      const parsed = saved ? JSON.parse(saved) : INITIAL_NOTES;
      return parsed.map((n: any) => ({
        ...n,
        attachments: n.attachments || [],
      }));
    } catch (e) {
      return INITIAL_NOTES;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null,
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Persist notes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSaveStatus("saving");
      try {
        localStorage.setItem(`${APP_ID}-notes`, JSON.stringify(notes));
        setTimeout(() => setSaveStatus("saved"), 300);
      } catch (e) {
        setSaveStatus("error");
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [notes]);

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    let result = notes;
    if (currentView.mode === ViewMode.Starred)
      result = result.filter((n) => n.isStarred && !n.isTrashed);
    else if (currentView.mode === ViewMode.Trash)
      result = result.filter((n) => n.isTrashed);
    else if (currentView.mode === ViewMode.Folder)
      result = result.filter(
        (n) => n.folderId === currentView.id && !n.isTrashed,
      );
    else if (currentView.mode === ViewMode.Tag)
      result = result.filter(
        (n) => n.tags.includes(currentView.id || "") && !n.isTrashed,
      );
    else result = result.filter((n) => !n.isTrashed);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return [...result].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, currentView, searchQuery]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId],
  );

  // Tag usage statistics
  const tagUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((n) => {
      if (!n.isTrashed) {
        n.tags.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    });
    return counts;
  }, [notes]);

  const allTags = useMemo(() => {
    return Object.keys(tagUsage).sort((a, b) => tagUsage[b] - tagUsage[a]);
  }, [tagUsage]);

  // Note actions
  const createNote = useCallback((folderId?: string) => {
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title: "Untitled Note",
      content: "",
      tags: [],
      attachments: [],
      isPinned: false,
      isStarred: false,
      isTrashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      readTime: 0,
      folderId,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n,
      ),
    );
  }, []);

  const toggleStar = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isStarred: !n.isStarred } : n)),
    );
  }, []);

  const togglePin = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
    );
  }, []);

  const moveToTrash = useCallback(
    (id: string) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isTrashed: true, isPinned: false } : n,
        ),
      );
      if (activeNoteId === id) setActiveNoteId(null);
    },
    [activeNoteId],
  );

  const restoreNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isTrashed: false } : n)),
    );
  }, []);

  const deletePermanently = useCallback((id: string) => {
    if (!confirm("Are you sure you want to delete this note permanently?"))
      return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNoteId(null);
  }, []);

  const addAttachment = useCallback(
    (noteId: string, attachment: Attachment) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? {
                ...n,
                attachments: [...n.attachments, attachment],
                updatedAt: Date.now(),
              }
            : n,
        ),
      );
    },
    [],
  );

  const resizeAttachment = useCallback(
    (noteId: string, attachmentId: string, width: number) => {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            return {
              ...n,
              attachments: n.attachments.map((a) =>
                a.id === attachmentId ? { ...a, width } : a,
              ),
              updatedAt: Date.now(),
            };
          }
          return n;
        }),
      );
    },
    [],
  );

  // Global tag management
  const renameGlobalTag = (oldTag: string, newTag: string) => {
    const cleanNewTag = newTag.trim().toLowerCase();
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        tags: n.tags
          .map((t) => (t === oldTag ? cleanNewTag : t))
          .filter((t, i, self) => self.indexOf(t) === i),
      })),
    );
  };

  const deleteGlobalTag = (tagToDelete: string) => {
    setNotes((prev) =>
      prev.map((n) => ({
        ...n,
        tags: n.tags.filter((t) => t !== tagToDelete),
      })),
    );
  };

  return {
    notes,
    setNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    filteredNotes,
    saveStatus,
    setSaveStatus,
    tagUsage,
    allTags,
    createNote,
    updateNote,
    toggleStar,
    togglePin,
    moveToTrash,
    restoreNote,
    deletePermanently,
    addAttachment,
    resizeAttachment,
    renameGlobalTag,
    deleteGlobalTag,
  };
};
