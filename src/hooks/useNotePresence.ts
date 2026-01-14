import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { db } from "../lib/db";
import { PresenceUser } from "../../types";

// Generate a consistent color based on user ID
const generateColor = (userId: string) => {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Stable dummy room ID for when no note is selected
const DUMMY_ROOM_ID = "__no_note__";

export const useNotePresence = (noteId: string | null) => {
  const { user } = useUser();
  const userId = user?.id;
  const userName = user?.fullName || user?.username || "Anonymous";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const userColor = userId ? generateColor(userId) : "#888";

  // Always create a room reference - use dummy if no noteId
  // This ensures hooks are called unconditionally (React rules of hooks)
  const roomId = noteId || DUMMY_ROOM_ID;
  const room = db.room("note", roomId);
  const isActiveRoom = noteId !== null;

  // Always call presence hook unconditionally
  const {
    user: myPresence,
    peers,
    publishPresence,
  } = db.rooms.usePresence(room, {
    initialPresence: {
      name: userName,
      email: userEmail,
      color: userColor,
    },
  });

  // Always call typing indicator hook unconditionally
  const { active: typingUsers, inputProps: typingInputProps } =
    db.rooms.useTypingIndicator(room, "typing");

  // Update presence when user info changes (only for active room)
  useEffect(() => {
    if (!isActiveRoom || !userId) return;
    publishPresence({
      name: userName,
      email: userEmail,
      color: userColor,
    });
  }, [isActiveRoom, userId, userName, userEmail, userColor, publishPresence]);

  // Get list of online peers (only return data for active room)
  const onlinePeers = useMemo(() => {
    if (!isActiveRoom) return [];
    return Object.entries(peers).map(([peerId, peer]) => ({
      id: peerId,
      ...(peer as PresenceUser),
    }));
  }, [peers, isActiveRoom]);

  // Get typing users (only for active room)
  const typingPeers = useMemo(() => {
    if (!isActiveRoom) return [];
    return typingUsers.map((u: any) => ({
      name: u.name || "Someone",
      email: u.email || "",
    }));
  }, [typingUsers, isActiveRoom]);

  return {
    myPresence: isActiveRoom ? (myPresence as PresenceUser | null) : null,
    onlinePeers,
    typingPeers,
    typingInputProps: isActiveRoom
      ? typingInputProps
      : { onKeyDown: () => {}, onBlur: () => {} },
    publishPresence: isActiveRoom ? publishPresence : () => {},
    isInRoom: isActiveRoom && !!myPresence,
  };
};
