import React from "react";
import { Cursors } from "@instantdb/react";
import { db } from "../../lib/db";

interface NoteCursorsProps {
  noteId: string;
  children: React.ReactNode;
  userColor?: string;
}

export const NoteCursors: React.FC<NoteCursorsProps> = ({
  noteId,
  children,
  userColor = "#3b82f6",
}) => {
  const room = db.room("note", noteId);

  return (
    <Cursors
      room={room}
      className="h-full w-full relative"
      userCursorColor={userColor}
      renderCursor={(props) => (
        <CustomCursor
          color={props.color}
          name={props.presence?.name || "Anonymous"}
        />
      )}
    >
      {children}
    </Cursors>
  );
};

// Custom cursor component
const CustomCursor: React.FC<{ color: string; name: string }> = ({
  color,
  name,
}) => {
  return (
    <div className="pointer-events-none">
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
      >
        <path
          d="M5.5 3L19 12L12 13L9 20L5.5 3Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {/* Name label */}
      <div
        className="absolute top-5 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-lg uppercase tracking-wider"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
};

export default NoteCursors;
