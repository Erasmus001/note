import { useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { db, id } from "../lib/db";
import { Permission, Collaborator, ShareLink } from "../../types";

// Generate a random token for share links
const generateToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const useCollaboration = (noteId?: string) => {
  const { user } = useUser();
  const userId = user?.id;
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userName = user?.fullName || user?.username || "Anonymous";

  // Query collaborators for a specific note (owned by current user)
  const { data: ownedCollabData, isLoading: isLoadingOwned } = db.useQuery(
    userId && noteId
      ? { collaborators: { $: { where: { noteId, ownerId: userId } } } }
      : null,
  );

  // Query notes shared with current user
  const { data: sharedWithMeData, isLoading: isLoadingShared } = db.useQuery(
    userId
      ? { collaborators: { $: { where: { collaboratorId: userId } } } }
      : null,
  );

  // Query share links for a specific note
  const { data: shareLinkData, isLoading: isLoadingLinks } = db.useQuery(
    userId && noteId
      ? { shareLinks: { $: { where: { noteId, ownerId: userId } } } }
      : null,
  );

  // Get collaborators for the current note
  const collaborators = useMemo(() => {
    if (!ownedCollabData?.collaborators) return [];
    return ownedCollabData.collaborators as Collaborator[];
  }, [ownedCollabData]);

  // Get all notes shared with me
  const sharedWithMe = useMemo(() => {
    if (!sharedWithMeData?.collaborators) return [];
    return sharedWithMeData.collaborators as Collaborator[];
  }, [sharedWithMeData]);

  // Get share links for current note
  const shareLinks = useMemo(() => {
    if (!shareLinkData?.shareLinks) return [];
    return (shareLinkData.shareLinks as ShareLink[]).filter((l) => l.isActive);
  }, [shareLinkData]);

  // Share note with a user by email
  const shareNote = useCallback(
    async (
      targetNoteId: string,
      email: string,
      name: string,
      collaboratorUserId: string,
      permission: Permission = "view",
    ) => {
      if (!userId) return null;

      // Check if already shared
      const existing = collaborators.find(
        (c) => c.collaboratorEmail === email && c.noteId === targetNoteId,
      );
      if (existing) {
        // Update permission instead
        db.transact(db.tx.collaborators[existing.id].update({ permission }));
        return existing;
      }

      const newId = id();
      const collaborator = {
        noteId: targetNoteId,
        ownerId: userId,
        collaboratorId: collaboratorUserId,
        collaboratorEmail: email,
        collaboratorName: name,
        permission,
        createdAt: Date.now(),
      };
      db.transact(db.tx.collaborators[newId].update(collaborator));
      return { id: newId, ...collaborator } as Collaborator;
    },
    [userId, collaborators],
  );

  // Remove a collaborator
  const removeCollaborator = useCallback(
    (collaboratorId: string) => {
      if (!userId) return;
      db.transact(db.tx.collaborators[collaboratorId].delete());
    },
    [userId],
  );

  // Update collaborator permission
  const updatePermission = useCallback(
    (collaboratorId: string, permission: Permission) => {
      if (!userId) return;
      db.transact(db.tx.collaborators[collaboratorId].update({ permission }));
    },
    [userId],
  );

  // Create a share link for a note
  const createShareLink = useCallback(
    (
      targetNoteId: string,
      permission: Permission = "view",
      expiresInDays: number = 0,
    ) => {
      if (!userId) return null;

      const newId = id();
      const token = generateToken();
      const expiresAt =
        expiresInDays > 0
          ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000
          : 0;

      const shareLink = {
        noteId: targetNoteId,
        ownerId: userId,
        token,
        permission,
        expiresAt,
        isActive: true,
        createdAt: Date.now(),
      };

      db.transact(db.tx.shareLinks[newId].update(shareLink));
      return { id: newId, ...shareLink } as ShareLink;
    },
    [userId],
  );

  // Deactivate a share link
  const deactivateShareLink = useCallback(
    (shareLinkId: string) => {
      if (!userId) return;
      db.transact(db.tx.shareLinks[shareLinkId].update({ isActive: false }));
    },
    [userId],
  );

  // Accept a share link invitation
  const acceptShareLink = useCallback(
    async (token: string) => {
      if (!userId || !userEmail) return null;

      // We need to query for the share link by token
      // This would typically be done server-side, but for now we handle client-side
      const { data } = await db.queryOnce({
        shareLinks: { $: { where: { token, isActive: true } } },
      });

      if (!data?.shareLinks || data.shareLinks.length === 0) {
        throw new Error("Invalid or expired share link");
      }

      const link = data.shareLinks[0] as ShareLink;

      // Check if link is expired
      if (link.expiresAt > 0 && Date.now() > link.expiresAt) {
        throw new Error("Share link has expired");
      }

      // Check if already a collaborator
      const { data: existingData } = await db.queryOnce({
        collaborators: {
          $: { where: { noteId: link.noteId, collaboratorId: userId } },
        },
      });

      if (
        existingData?.collaborators &&
        existingData.collaborators.length > 0
      ) {
        // Already a collaborator
        return existingData.collaborators[0] as Collaborator;
      }

      // Add as collaborator
      const newId = id();
      const collaborator = {
        noteId: link.noteId,
        ownerId: link.ownerId,
        collaboratorId: userId,
        collaboratorEmail: userEmail,
        collaboratorName: userName,
        permission: link.permission,
        createdAt: Date.now(),
      };

      db.transact(db.tx.collaborators[newId].update(collaborator));
      return { id: newId, ...collaborator } as Collaborator;
    },
    [userId, userEmail, userName],
  );

  // Get share link URL
  const getShareLinkUrl = useCallback((token: string) => {
    return `${window.location.origin}/invite/${token}`;
  }, []);

  // Check if current user can edit this note (is owner or has edit permission)
  const canEdit = useCallback(
    (targetNoteId: string, noteOwnerId: string) => {
      if (!userId) return false;
      if (noteOwnerId === userId) return true;

      const collab = sharedWithMe.find(
        (c) => c.noteId === targetNoteId && c.permission === "edit",
      );
      return !!collab;
    },
    [userId, sharedWithMe],
  );

  return {
    collaborators,
    sharedWithMe,
    shareLinks,
    isLoading: isLoadingOwned || isLoadingShared || isLoadingLinks,
    shareNote,
    removeCollaborator,
    updatePermission,
    createShareLink,
    deactivateShareLink,
    acceptShareLink,
    getShareLinkUrl,
    canEdit,
  };
};
