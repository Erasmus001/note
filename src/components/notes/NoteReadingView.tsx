import React from 'react';
import { Attachment } from '../../../types';
import AttachmentRenderer from '../attachments/AttachmentRenderer';

interface NoteReadingViewProps {
  title: string;
  content: string;
  attachments: Attachment[];
  onImageClick: (att: Attachment) => void;
}

/**
 * Read-only view for notes
 */
const NoteReadingView: React.FC<NoteReadingViewProps> = ({
  title,
  content,
  attachments,
  onImageClick
}) => {
  const regex = /(\[(?:File|Link): .*?\]\(att-.*?\))/g;
  const parts = content.split(regex);

  return (
    <div className="relative">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-12 pb-6 border-b border-zinc-100 dark:border-zinc-900">
        {title || 'Untitled Note'}
      </h1>
      <div className="space-y-4">
        {parts.map((part, idx) => {
          if (!part) return null;

          const match = part.match(/^\[(?:File|Link): (.*?)\]\((att-.*?)\)$/);
          if (match) {
            const attId = match[2];
            const attachment = attachments.find(a => a.id === attId);
            if (attachment) {
              return (
                <AttachmentRenderer
                  key={idx}
                  attachment={attachment}
                  onImageClick={onImageClick}
                  readOnly
                />
              );
            }
          }

          if (!part.trim()) return <div key={idx} className="h-4" />;

          return (
            <p key={idx} className="leading-relaxed text-zinc-700 dark:text-zinc-300 text-lg whitespace-pre-wrap">
              {part}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export default NoteReadingView;
