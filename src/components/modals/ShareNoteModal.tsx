import React, { useState } from "react";
import {
  X,
  Share2,
  Link,
  Copy,
  Check,
  Trash2,
  Mail,
  Eye,
  Edit3,
  Clock,
} from "lucide-react";
import { useCollaboration } from "../../hooks";
import { Permission, Collaborator, ShareLink } from "../../../types";

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
}

export const ShareNoteModal: React.FC<ShareNoteModalProps> = ({
  isOpen,
  onClose,
  noteId,
  noteTitle,
}) => {
  const {
    collaborators,
    shareLinks,
    shareNote,
    removeCollaborator,
    updatePermission,
    createShareLink,
    deactivateShareLink,
    getShareLinkUrl,
  } = useCollaboration(noteId);

  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<Permission>("view");
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      // For now, we use email as a placeholder for collaboratorId
      // In a real app, you'd look up the user by email first
      await shareNote(noteId, email.trim(), email.split("@")[0], email.trim(), permission);
      setEmail("");
      setError("");
    } catch (err) {
      setError("Failed to share note. Please try again.");
    }
  };

  const handleCreateLink = async () => {
    setIsCreatingLink(true);
    try {
      createShareLink(noteId, permission);
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleCopyLink = async (token: string, linkId: string) => {
    const url = getShareLinkUrl(token);
    await navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Share Note</h2>
              <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px]">
                {noteTitle || "Untitled Note"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Email Invite */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
              <Mail size={16} />
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter email address..."
                className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as Permission)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold cursor-pointer transition-all"
              >
                <option value="view">View</option>
                <option value="edit">Edit</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            <button
              onClick={handleShare}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              <Mail size={18} />
              Send Invite
            </button>
          </div>

          {/* Share Link */}
          <div className="space-y-3 border-t border-zinc-100 pt-6">
            <label className="text-sm font-bold text-zinc-700 flex items-center gap-2">
              <Link size={16} />
              Share via link
            </label>
            <button
              onClick={handleCreateLink}
              disabled={isCreatingLink}
              className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-900 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-200 shadow-sm active:scale-[0.98]"
            >
              <Link size={18} />
              {isCreatingLink ? "Creating..." : "Create Share Link"}
            </button>

            {/* Existing Links */}
            {shareLinks.length > 0 && (
              <div className="space-y-2 mt-3">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between bg-zinc-50 rounded-xl p-3 border border-zinc-100 group"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {link.permission === "edit" ? (
                        <Edit3 size={14} className="text-amber-600" />
                      ) : (
                        <Eye size={14} className="text-zinc-500" />
                      )}
                      <span className="text-zinc-700 font-bold capitalize">
                        {link.permission} access
                      </span>
                      {link.expiresAt > 0 && (
                        <span className="text-zinc-400 flex items-center gap-1 font-medium">
                          <Clock size={12} />
                          Expires:{" "}
                          {new Date(link.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopyLink(link.token, link.id)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-blue-600 border border-transparent hover:border-zinc-200"
                        title="Copy link"
                      >
                        {copiedLinkId === link.id ? (
                          <Check size={16} className="text-green-600" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => deactivateShareLink(link.id)}
                        className="p-2 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-red-600 border border-transparent hover:border-red-100"
                        title="Revoke link"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Collaborators */}
          {collaborators.length > 0 && (
            <div className="space-y-3 border-t border-zinc-100 pt-6">
              <label className="text-sm font-bold text-zinc-700">
                People with access ({collaborators.length})
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between bg-zinc-50 rounded-xl p-3 border border-zinc-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {collab.collaboratorName?.[0]?.toUpperCase() ||
                          collab.collaboratorEmail[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 line-clamp-1">
                          {collab.collaboratorName || collab.collaboratorEmail}
                        </p>
                        <p className="text-xs text-zinc-500 font-medium line-clamp-1">
                          {collab.collaboratorEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <select
                        value={collab.permission}
                        onChange={(e) =>
                          updatePermission(
                            collab.id,
                            e.target.value as Permission
                          )
                        }
                        className="bg-white border text-xs font-bold rounded-lg px-2 py-1 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>
                      <button
                        onClick={() => removeCollaborator(collab.id)}
                        className="p-1.5 hover:bg-white rounded-lg transition-colors text-zinc-400 hover:text-red-600 border border-transparent hover:border-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
