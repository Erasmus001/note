import React, { useRef, useEffect } from 'react';
import { FolderIcon, X } from 'lucide-react';

interface FolderModalProps {
  isOpen: boolean;
  folderName: string;
  folderIcon: string;
  onFolderNameChange: (name: string) => void;
  onFolderIconChange: (icon: string) => void;
  onSave: () => void;
  onClose: () => void;
  isEditing?: boolean;
}

const EMOJI_OPTIONS = ['📁', '💼', '🎯', '📖', '🎨', '🔬', '💡', '🚀', '❤️', '⭐'];

/**
 * Modal for creating a new folder
 */
const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  folderName,
  folderIcon,
  onFolderNameChange,
  onFolderIconChange,
  onSave,
  onClose,
  isEditing = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <FolderIcon size={20} />
            </div>
            {isEditing ? 'Rename Folder' : 'Create New Folder'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold text-zinc-500 mb-2">Folder Icon</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => onFolderIconChange(emoji)}
                className={`w-10 h-10 text-xl flex items-center justify-center rounded-xl border-2 transition-all ${folderIcon === emoji
                  ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800'
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Folder name..."
          value={folderName}
          onChange={(e) => onFolderNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl mb-6 outline-none text-sm"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-medium"
          >
            {isEditing ? 'Save Changes' : 'Create Folder'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;
