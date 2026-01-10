
import { Note, Folder } from './types';

export const INITIAL_FOLDERS: Folder[] = [
  { id: 'f-1', name: 'Personal', icon: '😎' },
  { id: 'f-2', name: 'Work', icon: '💼' },
  { id: 'f-3', name: 'Design Insight', icon: '📖' },
  { id: 'f-4', name: 'Business', icon: '🎯' },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n-1',
    title: 'Welcome to Super Notes',
    content: `# Welcome to your new workspace\n\nSuper Notes is designed for deep work. It supports **Rich Text** and **Markdown** hybrid editing.\n\n### Key Features:\n- Keyboard first navigation\n- Three-pane layout\n- Tagging system\n- Pinning critical thoughts\n\nStart typing here to see how it feels.`,
    tags: ['guide', 'getting-started'],
    attachments: [],
    folderId: 'f-1',
    isPinned: true,
    isStarred: true,
    isTrashed: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    readTime: 2
  },
  {
    id: 'n-2',
    title: 'Review of My Personal Improvement Project',
    content: `"When someone isn't talking, my brain tends to fill in the blanks with how I feel about myself." — Whitney Cummings.\n\nWe have probably all experienced getting caught up in our own thoughts at some point while communicating. It is when those thoughts interfere with our capability to communicate that you begin to run into problems.`,
    tags: ['personal', 'psychology'],
    attachments: [],
    folderId: 'f-1',
    isPinned: false,
    isStarred: true,
    isTrashed: false,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
    readTime: 5
  },
  {
    id: 'n-3',
    title: 'Design Philosophy for 2025',
    content: `Focus on minimalist interactions and high information density without clutter. The goal is to create tools that grow with the user.`,
    tags: ['design', 'strategy'],
    attachments: [],
    folderId: 'f-3',
    isPinned: true,
    isStarred: false,
    isTrashed: false,
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 129600000,
    readTime: 3
  }
];

export const APP_ID = 'super-notes-v1';