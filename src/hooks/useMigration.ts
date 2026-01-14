import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { db, id } from "../lib/db";
import { APP_ID } from "../../constants";
import { Note, Folder, AppSettings } from "../../types";

export const useMigration = () => {
  const { user, isLoaded } = useUser();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<
    "idle" | "running" | "completed" | "error"
  >("idle");

  useEffect(() => {
    const migrate = async () => {
      if (!isLoaded || !user) return;

      // Check if migration has already been done for this user
      // We can use a special setting or just check if migration key exists in localStorage
      const migrationFlag = localStorage.getItem(
        `${APP_ID}-migration-done-${user.id}`,
      );
      if (migrationFlag === "true") {
        setMigrationStatus("completed");
        return;
      }

      setIsMigrating(true);
      setMigrationStatus("running");

      try {
        const notesStr = localStorage.getItem(`${APP_ID}-notes`);
        const foldersStr = localStorage.getItem(`${APP_ID}-folders`);
        const settingsStr = localStorage.getItem(`${APP_ID}-settings`);

        const transactions: any[] = [];
        const folderIdMap: Record<string, string> = {};

        // Migrate Folders
        if (foldersStr) {
          try {
            const folders: Folder[] = JSON.parse(foldersStr);
            folders.forEach((f) => {
              const newFolderId = id();
              folderIdMap[f.id] = newFolderId;

              transactions.push(
                db.tx.folders[newFolderId].update({
                  userId: user.id,
                  name: f.name,
                  icon: f.icon || "📁",
                  createdAt: Date.now(),
                }),
              );
            });
          } catch (e) {
            console.error("Failed to parse folders for migration", e);
          }
        }

        // Migrate Notes
        if (notesStr) {
          try {
            const notes: Note[] = JSON.parse(notesStr);
            notes.forEach((n) => {
              const newNoteId = id();
              const newFolderId = n.folderId
                ? folderIdMap[n.folderId] || ""
                : "";

              transactions.push(
                db.tx.notes[newNoteId].update({
                  userId: user.id,
                  title: n.title,
                  content: n.content,
                  tags: n.tags || [],
                  attachments: n.attachments || [],
                  folderId: newFolderId,
                  isPinned: n.isPinned || false,
                  isStarred: n.isStarred || false,
                  isTrashed: n.isTrashed || false,
                  createdAt: n.createdAt || Date.now(),
                  updatedAt: n.updatedAt || Date.now(),
                  readTime: n.readTime || 0,
                }),
              );
            });
          } catch (e) {
            console.error("Failed to parse notes for migration", e);
          }
        }

        // Migrate Settings
        if (settingsStr) {
          const settings: AppSettings = JSON.parse(settingsStr);
          transactions.push(
            db.tx.settings[id()].update({
              userId: user.id,
              theme: settings.theme,
              fontSize: settings.fontSize,
              editorWidth: settings.editorWidth,
              updatedAt: Date.now(),
            }),
          );
        }

        if (transactions.length > 0) {
          await db.transact(transactions);
        }

        localStorage.setItem(`${APP_ID}-migration-done-${user.id}`, "true");
        setMigrationStatus("completed");
      } catch (error) {
        console.error("Migration failed:", error);
        setMigrationStatus("error");
      } finally {
        setIsMigrating(false);
      }
    };

    migrate();
  }, [isLoaded, user]);

  return { isMigrating, migrationStatus };
};
