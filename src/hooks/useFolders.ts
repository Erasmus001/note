import { useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { Folder } from "../../types";
import { db, id } from "../lib/db";

export const useFolders = () => {
  const { user } = useUser();
  const userId = user?.id;

  // Read data from InstantDB
  const { isLoading, error, data } = db.useQuery(
    userId ? { folders: { $: { where: { userId } } } } : null,
  );

  const folders = useMemo(() => {
    if (!data?.folders) return [];
    return data.folders as Folder[];
  }, [data]);

  const addFolder = useCallback(
    (name: string, icon: string = "📁") => {
      if (!userId) return null;
      const newId = id();
      const newFolder = {
        userId,
        name: name.trim(),
        icon,
        createdAt: Date.now(),
      };
      db.transact(db.tx.folders[newId].update(newFolder));
      return { id: newId, ...newFolder } as Folder;
    },
    [userId],
  );

  const deleteFolder = useCallback(
    (folderId: string, noteIdsToTrash: string[] = []) => {
      if (!userId) return;

      const txs = [
        db.tx.folders[folderId].delete(),
        ...noteIdsToTrash.map((noteId) =>
          db.tx.notes[noteId].update({
            folderId: "",
            isTrashed: true,
            updatedAt: Date.now(),
          }),
        ),
      ];

      db.transact(txs);
    },
    [userId],
  );

  const updateFolder = useCallback(
    (folderId: string, updates: Partial<Folder>) => {
      if (!userId) return;
      db.transact(db.tx.folders[folderId].update(updates));
    },
    [userId],
  );

  return {
    folders,
    isLoading,
    error,
    addFolder,
    deleteFolder,
    updateFolder,
  };
};
