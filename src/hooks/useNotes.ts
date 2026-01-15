import { useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Note, Attachment, Collaborator } from "../../types";
import { db, id } from "../lib/db";

export const useNotes = () => {
  const { user } = useUser();
  const userId = user?.id;

  // Read owned notes from InstantDB
  const {
    isLoading: isLoadingOwned,
    error: ownedError,
    data,
  } = db.useQuery(userId ? { notes: { $: { where: { userId } } } } : null);

  // Read notes shared with me (via collaborators table)
  const { isLoading: isLoadingShared, data: collabData } = db.useQuery(
    userId
      ? { collaborators: { $: { where: { collaboratorId: userId } } } }
      : null,
  );

  // Get shared note IDs
  const sharedNoteIds = useMemo(() => {
    if (!collabData?.collaborators) return [];
    return (collabData.collaborators as Collaborator[]).map((c) => c.noteId);
  }, [collabData]);

  // Query shared notes by their IDs
  const { isLoading: isLoadingSharedNotes, data: sharedNotesData } =
    db.useQuery(
      sharedNoteIds.length > 0
        ? { notes: { $: { where: { id: { $in: sharedNoteIds } } } } }
        : null,
    );

  // Combine owned and shared notes
  const notes = useMemo(() => {
    const ownedNotes = data?.notes ? (data.notes as Note[]) : [];
    const sharedNotes = sharedNotesData?.notes
      ? (sharedNotesData.notes as Note[])
      : [];

    // Merge, avoiding duplicates
    const allNotes = [...ownedNotes];
    sharedNotes.forEach((shared) => {
      if (!allNotes.find((n) => n.id === shared.id)) {
        allNotes.push(shared);
      }
    });

    return allNotes;
  }, [data, sharedNotesData]);

  // Separate owned and shared notes
  const ownedNotes = useMemo(() => {
    if (!data?.notes) return [];
    return data.notes as Note[];
  }, [data]);

  const sharedNotes = useMemo(() => {
    if (!sharedNotesData?.notes) return [];
    return sharedNotesData.notes as Note[];
  }, [sharedNotesData]);

  const isLoading = isLoadingOwned || isLoadingShared || isLoadingSharedNotes;
  const error = ownedError;

  // No internal activeNoteId state
  // No internal filtering

  // Tag usage statistics
  const tagUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((n) => {
      if (!n.isTrashed && n.tags) {
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
  const createNote = useCallback(
    (folderId?: string) => {
      if (!userId) return null;
      const newId = id();
      const newNote: any = {
        userId,
        title: "Untitled Note",
        content: "",
        jsonContent: null,
        tags: [],
        attachments: [],
        isPinned: false,
        isStarred: false,
        isTrashed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        readTime: 0,
        folderId: folderId || "",
      };
      db.transact(db.tx.notes[newId].update(newNote));
      return { id: newId, ...newNote } as Note;
    },
    [userId],
  );

  const updateNote = useCallback(
    (noteId: string, updates: Partial<Note>) => {
      if (!userId) return;
      db.transact(
        db.tx.notes[noteId].update({ ...updates, updatedAt: Date.now() }),
      );
    },
    [userId],
  );

  const toggleStar = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        updateNote(noteId, { isStarred: !note.isStarred });
      }
    },
    [notes, updateNote],
  );

  const togglePin = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        updateNote(noteId, { isPinned: !note.isPinned });
      }
    },
    [notes, updateNote],
  );

  const moveToTrash = useCallback(
    (noteId: string) => {
      updateNote(noteId, { isTrashed: true, isPinned: false });
    },
    [updateNote],
  );

  const restoreNote = useCallback(
    (noteId: string) => {
      updateNote(noteId, { isTrashed: false });
    },
    [updateNote],
  );

  const deletePermanently = useCallback((noteId: string) => {
    db.transact(db.tx.notes[noteId].delete());
  }, []);

  const emptyTrash = useCallback(() => {
    const trashedNotes = notes.filter((n) => n.isTrashed);
    if (trashedNotes.length === 0) return;
    const txs = trashedNotes.map((n) => db.tx.notes[n.id].delete());
    db.transact(txs);
  }, [notes]);

  const addAttachment = useCallback(
    (noteId: string, attachment: Attachment) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        updateNote(noteId, {
          attachments: [...note.attachments, attachment],
        });
      }
    },
    [notes, updateNote],
  );

  const resizeAttachment = useCallback(
    (noteId: string, attachmentId: string, width: number) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        updateNote(noteId, {
          attachments: note.attachments.map((a) =>
            a.id === attachmentId ? { ...a, width } : a,
          ),
        });
      }
    },
    [notes, updateNote],
  );

  // Global tag management
  const renameGlobalTag = (oldTag: string, newTag: string) => {
    const cleanNewTag = newTag.trim().toLowerCase();
    const txs = notes
      .filter((n) => n.tags.includes(oldTag))
      .map((n) =>
        db.tx.notes[n.id].update({
          tags: n.tags
            .map((t) => (t === oldTag ? cleanNewTag : t))
            .filter((t, i, self) => self.indexOf(t) === i),
          updatedAt: Date.now(),
        }),
      );
    if (txs.length > 0) db.transact(txs);
  };

  const deleteGlobalTag = (tagToDelete: string) => {
    const txs = notes
      .filter((n) => n.tags.includes(tagToDelete))
      .map((n) =>
        db.tx.notes[n.id].update({
          tags: n.tags.filter((t) => t !== tagToDelete),
          updatedAt: Date.now(),
        }),
      );
    if (txs.length > 0) db.transact(txs);
  };

  return {
    notes,
    ownedNotes,
    sharedNotes,
    isLoading,
    error,
    saveStatus: isLoading ? "saving" : error ? "error" : "saved",
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
  };
};
