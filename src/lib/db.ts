import { init, i, id, InstaQLEntity } from "@instantdb/react";

// Instant app ID from environment variables
// @ts-ignore
const APP_ID = import.meta.env.VITE_INSTANTDB_APP_ID;

if (!APP_ID) {
  throw new Error("Missing InstantDB App ID");
}

// Define the schema
const schema = i.schema({
  entities: {
    notes: i.entity({
      userId: i.string(),
      title: i.string(),
      content: i.string(), // Plain text for search/preview
      jsonContent: i.json(), // Editor.js JSON blocks
      tags: i.json(), // InstantDB supports json for arrays/objects
      attachments: i.json(),
      folderId: i.string(),
      isPinned: i.boolean(),
      isStarred: i.boolean(),
      isTrashed: i.boolean(),
      createdAt: i.number(),
      updatedAt: i.number(),
      readTime: i.number(),
    }),
    folders: i.entity({
      userId: i.string(),
      name: i.string(),
      icon: i.string(),
      createdAt: i.number(),
    }),
    settings: i.entity({
      userId: i.string(),
      theme: i.string(),
      fontSize: i.string(),
      editorWidth: i.string(),
      updatedAt: i.number(),
    }),
    // Collaboration: tracks who has access to which notes
    collaborators: i.entity({
      noteId: i.string(),
      ownerId: i.string(), // Note owner's userId
      collaboratorId: i.string(), // Collaborator's userId
      collaboratorEmail: i.string(), // For display/lookup
      collaboratorName: i.string(), // Display name
      permission: i.string(), // "view" | "edit"
      createdAt: i.number(),
    }),
    // Shareable invite links for notes
    shareLinks: i.entity({
      noteId: i.string(),
      ownerId: i.string(),
      token: i.string(), // Unique token for the link
      permission: i.string(), // "view" | "edit"
      expiresAt: i.number(), // 0 = never expires
      isActive: i.boolean(),
      createdAt: i.number(),
    }),
  },
  // Room schema for real-time collaboration features
  rooms: {
    note: {
      presence: i.entity({
        name: i.string(),
        email: i.string(),
        color: i.string(),
      }),
      topics: {
        typing: i.entity({
          isTyping: i.boolean(),
        }),
      },
    },
  },
});

export type DbNote = InstaQLEntity<typeof schema, "notes">;
export type DbFolder = InstaQLEntity<typeof schema, "folders">;
export type DbSettings = InstaQLEntity<typeof schema, "settings">;
export type DbCollaborator = InstaQLEntity<typeof schema, "collaborators">;
export type DbShareLink = InstaQLEntity<typeof schema, "shareLinks">;

export const db = init({ appId: APP_ID, schema });
export { id };
