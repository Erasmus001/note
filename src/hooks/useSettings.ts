import { useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { AppSettings } from "../../types";
import { db, id } from "../lib/db";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  fontSize: "base",
  editorWidth: "standard",
};

export const useSettings = () => {
  const { user } = useUser();
  const userId = user?.id;

  // Read data from InstantDB
  const { isLoading, error, data } = db.useQuery(
    userId ? { settings: { $: { where: { userId } } } } : null,
  );

  const settings = useMemo(() => {
    if (!data?.settings || data.settings.length === 0) return DEFAULT_SETTINGS;
    // @ts-ignore
    return data.settings[0] as AppSettings;
  }, [data]);

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      if (!userId) return;

      const existingSettings = data?.settings?.[0];
      if (existingSettings) {
        db.transact(db.tx.settings[existingSettings.id].update(updates));
      } else {
        db.transact(
          db.tx.settings[id()].update({
            ...DEFAULT_SETTINGS,
            ...updates,
            userId,
            updatedAt: Date.now(),
          }),
        );
      }
    },
    [userId, data],
  );

  const setFontSize = useCallback(
    (fontSize: AppSettings["fontSize"]) => {
      updateSettings({ fontSize });
    },
    [updateSettings],
  );

  const setEditorWidth = useCallback(
    (editorWidth: AppSettings["editorWidth"]) => {
      updateSettings({ editorWidth });
    },
    [updateSettings],
  );

  return {
    settings,
    isLoading,
    error,
    setFontSize,
    setEditorWidth,
    updateSettings,
  };
};
