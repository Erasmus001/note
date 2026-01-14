export type NoteId = string;

export interface Attachment {
  id: string;
  name: string;
  type: "audio" | "video" | "image" | "document" | "url";
  url: string;
  size?: number;
  width?: number;
}

export interface Note {
  id: NoteId;
  title: string;
  content: string;
  jsonContent?: any;
  tags: string[];
  attachments: Attachment[];
  folderId?: string;
  isPinned: boolean;
  isStarred: boolean;
  isTrashed: boolean;
  createdAt: number;
  updatedAt: number;
  readTime: number;
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
}

export enum ViewMode {
  All = "all",
  Starred = "starred",
  Trash = "trash",
  Tag = "tag",
  Folder = "folder",
}

export interface AppSettings {
  theme: "light" | "dark";
  fontSize: "sm" | "base" | "lg";
  editorWidth: "narrow" | "standard" | "full";
}
