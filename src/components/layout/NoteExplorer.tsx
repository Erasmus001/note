import React from 'react';
import { Search, Plus, Info } from 'lucide-react';
import { Note, Folder, ViewMode } from '../../../types';
import NoteListItem from '../notes/NoteListItem';

interface NoteExplorerProps {
  notes: Note[];
  folders: Folder[];
  currentView: { mode: ViewMode; id?: string };
  activeNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
}

/**
 * Note list explorer panel
 */
const NoteExplorer: React.FC<NoteExplorerProps> = ({
  notes,
  folders,
  currentView,
  activeNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote
}) => {
  const getViewTitle = () => {
    if (currentView.mode === ViewMode.Folder) {
      return folders.find(f => f.id === currentView.id)?.name || 'Folder';
    }
    return currentView.mode;
  };

  return (
    <aside className="w-full md:w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <h2 className="font-semibold capitalize text-sm">{getViewTitle()}</h2>
        <button
          onClick={onCreateNote}
          className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Filter notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg outline-none text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length > 0 ? (
          notes.map(note => (
            <NoteListItem
              key={note.id}
              note={note}
              active={activeNoteId === note.id}
              onClick={() => onSelectNote(note.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
            <Info size={24} className="mb-2" />
            <p className="text-xs">No notes found</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default NoteExplorer;
