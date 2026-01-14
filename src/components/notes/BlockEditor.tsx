import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef
} from 'react';
import { GripVertical, X } from 'lucide-react';
import { Attachment } from '../../../types';
import AutoResizeTextarea from '../ui/AutoResizeTextarea';
import AttachmentRenderer from '../attachments/AttachmentRenderer';

// Block types for the editor
type Block =
  | { id: string; type: 'text'; content: string }
  | { id: string; type: 'attachment'; content: string; attachmentId: string };

interface BlockEditorProps {
  content: string;
  attachments: Attachment[];
  onUpdate: (content: string) => void;
  onUpload: (files: File[]) => Promise<Attachment[]>;
  onImageClick: (att: Attachment) => void;
  fontSizeClass: string;
  disabled: boolean;
  onAttachmentResize: (id: string, width: number) => void;
}

export interface BlockEditorRef {
  insertContent: (text: string) => void;
  insertFiles: (files: File[]) => void;
}

/**
 * Rich text block editor with drag-and-drop support for attachments
 */
const BlockEditor = forwardRef<BlockEditorRef, BlockEditorProps>(({
  content,
  attachments,
  onUpdate,
  onUpload,
  onImageClick,
  fontSizeClass,
  disabled,
  onAttachmentResize
}, ref) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Parse content into blocks
  const parseContent = useCallback((text: string) => {
    const regex = /(\[(?:File|Link): .*?\]\(att-.*?\))/g;
    const parts = text.split(regex);
    const newBlocks: Block[] = [];

    parts.forEach((part, index) => {
      if (!part) return;

      const match = part.match(/^\[(?:File|Link): (.*?)\]\((att-.*?)\)$/);
      if (match) {
        newBlocks.push({
          id: `block-${index}-${match[2]}`,
          type: 'attachment',
          content: part,
          attachmentId: match[2]
        });
      } else {
        newBlocks.push({
          id: `block-${index}-text`,
          type: 'text',
          content: part
        });
      }
    });

    if (newBlocks.length === 0) {
      newBlocks.push({ id: 'block-init', type: 'text', content: '' });
    }

    return newBlocks;
  }, []);

  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; });

  useEffect(() => {
    const currentSerialized = blocksRef.current.map(b => b.content).join('');
    if (content !== currentSerialized) {
      setBlocks(parseContent(content));
    }
  }, [content, parseContent]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    isDraggingRef.current = true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (!isDraggingRef.current) return;

    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(fromIndex) || fromIndex === toIndex) return;

    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);

    setBlocks(newBlocks);
    onUpdate(newBlocks.map(b => b.content).join(''));
    isDraggingRef.current = false;
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  const insertFiles = async (files: File[]) => {
    if (disabled) return;

    const newAttachments = await onUpload(files);
    if (newAttachments.length === 0) return;

    const attachmentBlocks: Block[] = newAttachments.map((att, i) => ({
      id: `block-new-att-${Date.now()}-${i}`,
      type: 'attachment',
      content: `\n[File: ${att.name}](${att.id})\n`,
      attachmentId: att.id
    }));

    const newBlocks = [...blocks, ...attachmentBlocks];
    newBlocks.push({ id: `block-pad-${Date.now()}`, type: 'text', content: '\n' });

    setBlocks(newBlocks);
    onUpdate(newBlocks.map(b => b.content).join(''));
  };

  const updateBlockContent = (index: number, newText: string) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], content: newText };
    setBlocks(newBlocks);
    onUpdate(newBlocks.map(b => b.content).join(''));
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
    onUpdate(newBlocks.map(b => b.content).join(''));
  };

  useImperativeHandle(ref, () => ({
    insertContent: (text: string) => {
      const newBlocks = [...blocks];
      newBlocks.push({ id: `block-insert-${Date.now()}`, type: 'text', content: text });
      setBlocks(newBlocks);
      onUpdate(newBlocks.map(b => b.content).join(''));
    },
    insertFiles
  }));

  return (
    <div
      ref={containerRef}
      className={`w-full min-h-[60vh] pb-32 outline-none ${disabled ? 'opacity-50' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {blocks.map((block, index) => {
        if (block.type === 'attachment') {
          const att = attachments.find(a => a.id === block.attachmentId);
          return (
            <div
              key={block.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className="group relative my-2 pl-6 pr-2 py-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/40 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-grab active:cursor-grabbing"
            >
              <div className="absolute left-1 top-1/2 -translate-y-1/2 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={16} />
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); removeBlock(index); }}
                className="absolute right-2 top-2 p-1.5 bg-white/80 dark:bg-black/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-zinc-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Remove attachment"
              >
                <X size={14} />
              </button>

              {att ? (
                <AttachmentRenderer
                  attachment={att}
                  onImageClick={onImageClick}
                  onResize={(w) => onAttachmentResize(att.id, w)}
                />
              ) : (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs rounded-lg">
                  Missing Attachment: {block.attachmentId}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <AutoResizeTextarea
              key={block.id}
              value={block.content}
              onChange={(e) => updateBlockContent(index, e.target.value)}
              disabled={disabled}
              placeholder={index === 0 && blocks.length === 1 ? "Start capturing your thoughts..." : undefined}
              className={`w-full bg-transparent border-none outline-none resize-none leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-200 dark:placeholder:text-zinc-800 ${fontSizeClass} overflow-hidden`}
              minHeight="1.5em"
            />
          );
        }
      })}
    </div>
  );
});

BlockEditor.displayName = 'BlockEditor';

export default BlockEditor;
