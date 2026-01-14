import React, { useRef, useEffect } from 'react';
import { Link as LinkIcon, X } from 'lucide-react';

interface UrlModalProps {
  isOpen: boolean;
  urlValue: string;
  onUrlChange: (url: string) => void;
  onAdd: () => void;
  onClose: () => void;
}

/**
 * Modal for adding a URL link attachment
 */
const UrlModal: React.FC<UrlModalProps> = ({
  isOpen,
  urlValue,
  onUrlChange,
  onAdd,
  onClose
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
      <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-xl">
              <LinkIcon size={20} />
            </div>
            Add Web Link
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="https://example.com"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl mb-6 outline-none text-sm"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            className="flex-1 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium"
          >
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrlModal;
