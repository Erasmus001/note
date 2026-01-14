import React from "react";
import { Pin } from "lucide-react";
import { Note } from "../../../types";

interface NoteListItemProps {
  note: Note;
  active: boolean;
  onClick: () => void;
}

/**
 * A single note item in the explorer list
 */
const NoteListItem: React.FC<NoteListItemProps> = React.memo(
  ({ note, active, onClick }) => (
    <div
      onClick={onClick}
      className={`group p-4 border-b border-zinc-100 dark:border-zinc-900 cursor-pointer transition-colors relative ${active
          ? "bg-zinc-50 dark:bg-zinc-900"
          : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
        }`}
    >
      <div className="flex items-start justify-between mb-1">
        <h3
          className={`font-bold text-sm truncate pr-4 ${active
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-700 dark:text-zinc-300"
            } ${note.isTrashed ? "italic opacity-60" : ""}`}
        >
          {note.title || "Untitled"}
        </h3>
        {note.isPinned && (
          <Pin
            size={12}
            className="text-blue-500 shrink-0"
            fill="currentColor"
          />
        )}
      </div>
      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed opacity-80 h-8 overflow-hidden">
        {(typeof note.content === "string"
          ? note.content
          : (note.content as any)?.blocks
            ? "Rich Text Note"
            : ""
        )
          .substring(0, 100)
          .trim() || "No preview content available."}
      </p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1">
          {note.tags.slice(0, 1).map((t) => (
            <span
              key={t}
              className="text-[9px] px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-sm font-bold"
            >
              #{t}
            </span>
          ))}
        </div>
        <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-tighter">
          {new Date(note.updatedAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      {active && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 dark:bg-zinc-100" />
      )}
    </div>
  ),
);

NoteListItem.displayName = "NoteListItem";

export default NoteListItem;
