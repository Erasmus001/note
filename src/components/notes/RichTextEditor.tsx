import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Checklist from '@editorjs/checklist';
// @ts-ignore
import Paragraph from '@editorjs/paragraph';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import Warning from '@editorjs/warning';
// @ts-ignore
import Code from '@editorjs/code';
// @ts-ignore
import InlineCode from '@editorjs/inline-code';
// @ts-ignore
import Marker from '@editorjs/marker';
// @ts-ignore
import Table from '@editorjs/table';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';
// @ts-ignore
import Embed from '@editorjs/embed';

import { createRoot } from 'react-dom/client';
import { Attachment } from '../../../types';
import AttachmentRenderer from '../attachments/AttachmentRenderer';
import { extractTextFromBlocks } from '../../utils';

interface RichTextEditorProps {
  content: string; // Plain text (legacy or derived)
  jsonContent?: any; // Editor.js JSON blocks
  attachments: Attachment[];
  onUpdate: (data: { text: string; json: OutputData }) => void;
  onImageClick: (att: Attachment) => void;
  fontSizeClass: string;
  disabled: boolean;
  onAttachmentResize: (id: string, width: number) => void;
}

export interface RichTextEditorRef {
  insertFiles: (files: File[]) => void;
  insertContent: (text: string) => void;
  insertAttachmentBlocks: (attachments: Attachment[]) => void;
}

// Custom Tool for Attachments
class AttachmentTool {
  static get toolbox() {
    return {
      title: 'Attachment',
      icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  private data: { attachmentId: string };
  private wrapper: HTMLElement;
  private api: any;
  private readOnly: boolean;
  private config: any;

  constructor({ data, api, readOnly, config }: any) {
    this.data = data;
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.wrapper = document.createElement('div');
  }

  render() {
    this.wrapper.innerHTML = '';
    // Find the attachment object from the provided attachments list in config
    // Use getAttachments if available (for dynamic access), otherwise fallback to static list
    const attachments = typeof this.config.getAttachments === 'function'
      ? this.config.getAttachments()
      : this.config.attachments;

    const attachment = attachments?.find((a: Attachment) => a.id === this.data.attachmentId);

    if (attachment) {
      const root = createRoot(this.wrapper);
      root.render(
        <AttachmentRenderer
          attachment={attachment}
          onImageClick={this.config.onImageClick}
          onResize={(w) => this.config.onAttachmentResize(attachment.id, w)}
          readOnly={this.readOnly}
        />
      );
    } else {
      this.wrapper.innerHTML = `<div class="p-4 bg-red-50 text-red-500 text-xs rounded">Missing Attachment: ${this.data.attachmentId}</div>`;
    }

    return this.wrapper;
  }

  save() {
    return {
      attachmentId: this.data.attachmentId
    };
  }
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content,
  jsonContent,
  attachments,
  onUpdate,
  onImageClick,
  fontSizeClass,
  disabled,
  onAttachmentResize
}, ref) => {
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(false);

  // Convert legacy string content to blocks
  const convertLegacyContent = useCallback((text: string) => {
    const blocks: any[] = [];
    const regex = /(\[(?:File|Link): .*?\]\(att-.*?\))/g;
    const parts = text.split(regex);

    parts.forEach(part => {
      if (!part.trim()) return;
      const match = part.match(/^\[(?:File|Link): (.*?)\]\((att-.*?)\)$/);
      if (match) {
        blocks.push({
          type: 'attachment',
          data: { attachmentId: match[2] }
        });
      } else {
        // Simple paragraph split by newlines
        const paragraphs = part.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
          blocks.push({
            type: 'paragraph',
            data: { text: p }
          });
        });
      }
    });

    if (blocks.length === 0) {
      blocks.push({ type: 'paragraph', data: { text: '' } });
    }

    return { time: Date.now(), blocks, version: '2.29.0' };
  }, []);

  // Ref to access latest attachments inside the Tool
  const attachmentsRef = useRef(attachments);
  useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    let initialData: OutputData;
    if (jsonContent) {
      initialData = jsonContent;
    } else if (content) {
      initialData = convertLegacyContent(content);
    } else {
      initialData = { time: Date.now(), blocks: [], version: '2.29.0' };
    }

    const editor = new EditorJS({
      holder: containerRef.current,
      data: initialData,
      readOnly: disabled,
      placeholder: 'Start capturing your thoughts...',
      minHeight: 0,
      tools: {
        header: Header,
        list: List,
        checklist: Checklist,
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
          config: {
            placeholder: 'Type forward slash to open menu'
          }
        },
        quote: Quote,
        warning: Warning,
        code: Code,
        inlineCode: InlineCode,
        marker: Marker,
        table: Table,
        delimiter: Delimiter,
        embed: Embed,
        attachment: {
          class: AttachmentTool,
          config: {
            getAttachments: () => attachmentsRef.current, // Access via function
            onImageClick,
            onAttachmentResize
          }
        }
      },
      onChange: async (api, event) => {
        const data = await api.saver.save();
        const text = extractTextFromBlocks(data.blocks);
        onUpdate({ json: data, text });
      }
    });

    editorRef.current = editor;
    editor.isReady.then(() => {
      isReadyRef.current = true;
    });

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.destroy();
        editorRef.current = null;
        isReadyRef.current = false;
      }
    };
  }, []); // Run once on mount


  // Handle external insertions
  useImperativeHandle(ref, () => ({
    insertFiles: (files: File[]) => {
      // Placeholder
      console.warn('Use insertAttachmentBlocks for files in RichTextEditor');
    },
    insertContent: (text: string) => {
      if (!editorRef.current || !isReadyRef.current) return;
      // Insert as paragraph
      const block = { type: 'paragraph', data: { text } };
      const count = editorRef.current.blocks.getBlocksCount();
      editorRef.current.blocks.insert(block.type, block.data, undefined, count, true);
    },
    // Custom method for our app
    insertAttachmentBlocks: (newAttachments: Attachment[]) => {
      if (!editorRef.current || !isReadyRef.current) return;
      newAttachments.forEach(att => {
        const count = editorRef.current?.blocks.getBlocksCount();
        editorRef.current?.blocks.insert('attachment', { attachmentId: att.id }, undefined, count, true);
      });
    }
  } as any));

  return (
    <div
      className={`prose max-w-none ${fontSizeClass} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div ref={containerRef} className="min-h-[60vh] pb-32" />
      <style>{`
            .ce-block__content { max-width: none; }
            .ce-toolbar__content { max-width: none; }
            .codex-editor__redactor { padding-bottom: 50px; }
        `}</style>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
