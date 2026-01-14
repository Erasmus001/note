import { init, i, id, InstaQLEntity } from "@instantdb/react";

// Instant app ID from environment variables
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
      content: i.string(),
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
  },
});

export type DbNote = InstaQLEntity<typeof schema, "notes">;
export type DbFolder = InstaQLEntity<typeof schema, "folders">;
export type DbSettings = InstaQLEntity<typeof schema, "settings">;

export const db = init({ appId: APP_ID, schema });
export { id };
