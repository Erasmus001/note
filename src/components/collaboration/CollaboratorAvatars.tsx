import React from "react";
import { PresenceUser } from "../../../types";

interface CollaboratorAvatarsProps {
  peers: Array<{ id: string } & PresenceUser>;
  maxVisible?: number;
}

export const CollaboratorAvatars: React.FC<CollaboratorAvatarsProps> = ({
  peers,
  maxVisible = 3,
}) => {
  if (peers.length === 0) return null;

  const visiblePeers = peers.slice(0, maxVisible);
  const remainingCount = peers.length - maxVisible;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visiblePeers.map((peer) => (
          <div
            key={peer.id}
            className="relative group"
            title={`${peer.name} (${peer.email})`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white shadow-md transition-transform hover:scale-110 hover:z-10"
              style={{ backgroundColor: peer.color }}
            >
              {peer.name?.[0]?.toUpperCase() || "?"}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 rounded-md text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
              {peer.name}
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 text-xs font-semibold ring-2 ring-white"
            title={`${remainingCount} more collaborator${remainingCount > 1 ? "s" : ""}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="ml-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
        {peers.length} {peers.length === 1 ? "person" : "people"} viewing
      </span>
    </div>
  );
};
