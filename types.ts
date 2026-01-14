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
  Shared = "shared", // Notes shared with me
}

export interface AppSettings {
  theme: "light";
  fontSize: "sm" | "base" | "lg";
  editorWidth: "narrow" | "standard" | "full";
}

// Collaboration types
export type Permission = "view" | "edit";

export interface Collaborator {
  id: string;
  noteId: string;
  ownerId: string;
  collaboratorId: string;
  collaboratorEmail: string;
  collaboratorName: string;
  permission: Permission;
  createdAt: number;
}

export interface ShareLink {
  id: string;
  noteId: string;
  ownerId: string;
  token: string;
  permission: Permission;
  expiresAt: number; // 0 = never expires
  isActive: boolean;
  createdAt: number;
}

export interface PresenceUser {
  name: string;
  email: string;
  color: string;
}
