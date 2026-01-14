import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Film,
  ImageIcon,
  Download,
  Globe,
  FileIcon,
  Maximize2,
  AlertTriangle,
  MoveDiagonal,
  ExternalLink,
  Twitter,
  Youtube
} from 'lucide-react';
import { Attachment } from '../../../types';
import { getYouTubeId, getTweetId } from '../../utils/embeds';
import TweetEmbed from './TweetEmbed';

interface AttachmentRendererProps {
  attachment: Attachment;
  onImageClick?: (att: Attachment) => void;
  onResize?: (width: number) => void;
  readOnly?: boolean;
}

/**
 * Visual renderer for various attachment types
 */
const AttachmentRenderer: React.FC<AttachmentRendererProps> = ({
  attachment,
  onImageClick,
  onResize,
  readOnly
}) => {
  const cardClasses = "my-4 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl group transition-all duration-200";
  const imgRef = useRef<HTMLImageElement>(null);
  const [localWidth, setLocalWidth] = useState(attachment.width || 0);

  useEffect(() => {
    setLocalWidth(attachment.width || 0);
  }, [attachment.width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth || 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = startWidth + (moveEvent.clientX - startX);
      if (currentWidth > 150) {
        setLocalWidth(currentWidth);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const finalWidth = startWidth + (upEvent.clientX - startX);

      if (finalWidth > 150) {
        onResize?.(finalWidth);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  switch (attachment.type) {
    case 'audio':
      return (
        <div className={cardClasses}>
          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
            <Music size={14} className="text-rose-500" /> Audio File: {attachment.name}
          </div>
          <audio controls className="w-full" src={attachment.url} />
        </div>
      );
    case 'video':
      return (
        <div className={cardClasses + " overflow-hidden"}>
          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
            <Film size={14} className="text-blue-500" /> Video File: {attachment.name}
          </div>
          <video controls className="w-full rounded-xl shadow-lg border border-zinc-200" src={attachment.url} />
        </div>
      );
    case 'image':
      return (
        <div className="my-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <ImageIcon size={14} className="text-green-500" /> {attachment.name}
            </div>
          </div>
          <div className="relative group inline-block max-w-full">
            <img
              ref={imgRef}
              src={attachment.url}
              alt={attachment.name}
              className="rounded-2xl shadow-md border border-zinc-200 max-w-full"
              style={{ width: localWidth ? `${localWidth}px` : '100%' }}
              onClick={() => onImageClick?.(attachment)}
            />
            {!readOnly && (
              <div
                className="absolute bottom-2 right-2 p-1.5 bg-black/50 hover:bg-blue-500 text-white rounded cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
              >
                <MoveDiagonal size={12} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white shadow-xl pointer-events-auto cursor-pointer" onClick={() => onImageClick?.(attachment)}>
                <Maximize2 size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    case 'url':
      const youtubeId = getYouTubeId(attachment.url);
      if (youtubeId) {
        return (
          <div className="my-6">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <Youtube size={14} className="text-red-600" /> YouTube Embed
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg border border-zinc-200 bg-black aspect-video relative group">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={attachment.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
              />
            </div>
          </div>
        );
      }

      const tweetId = getTweetId(attachment.url);

      if (tweetId) {
        return (
          <div className="my-6">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <Twitter size={14} className="text-sky-500" /> Social Embed
            </div>
            <TweetEmbed tweetId={tweetId} />
          </div>
        );
      }

      try {
        const urlObj = new URL(attachment.url);
        const hostname = urlObj.hostname;
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

        return (
          <div className="my-4 group relative overflow-hidden rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-all hover:border-zinc-300">
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-stretch">
              <div className="w-24 bg-zinc-100 flex items-center justify-center shrink-0 border-r border-zinc-200 relative overflow-hidden">
                <img
                  src={faviconUrl}
                  alt=""
                  className="w-10 h-10 object-contain opacity-90 group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                />
                <div className="absolute inset-0 flex items-center justify-center -z-10 text-zinc-300">
                  <Globe size={24} />
                </div>
              </div>
              <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                <h4 className="text-sm font-bold text-zinc-900 truncate pr-6 mb-1">
                  {attachment.name && attachment.name !== 'Web Link' ? attachment.name : hostname}
                </h4>
                <p className="text-xs text-zinc-500 line-clamp-1 mb-2 font-mono opacity-80">
                  {attachment.url}
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${attachment.url.startsWith('https') ? 'bg-green-500' : 'bg-zinc-400'}`} />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{hostname}</span>
                </div>
              </div>
              <div className="absolute top-3 right-3 text-zinc-300 group-hover:text-blue-500 transition-colors">
                <ExternalLink size={14} />
              </div>
            </a>
          </div>
        );
      } catch (e) {
        return (
          <div className="my-4 p-4 bg-zinc-50 border border-red-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 text-red-500">
              <AlertTriangle size={20} />
              <span className="text-xs font-bold">Invalid Link: {attachment.url}</span>
            </div>
          </div>
        );
      }
    default:
      return (
        <div className="my-4 p-4 flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl group transition-all shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-white rounded-xl text-zinc-400 group-hover:text-zinc-900 transition-colors shadow-inner">
              <FileIcon size={24} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Document Attachment</div>
              <div className="text-xs font-bold truncate">{attachment.name}</div>
            </div>
          </div>
          <a href={attachment.url} download={attachment.name} className="flex items-center gap-2 px-3 py-1.5 bg-white text-[10px] font-bold rounded-lg border border-zinc-200 hover:shadow-md transition-all">
            <Download size={14} /> Save
          </a>
        </div>
      );
  }
};

export default AttachmentRenderer;
