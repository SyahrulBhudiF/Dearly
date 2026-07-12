import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const mediaObjects = sqliteTable(
  "media_objects",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    kind: text("kind", { enum: ["image", "sticker", "thumbnail"] }).notNull(),
    r2Key: text("r2_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("media_objects_owner_id_idx").on(table.ownerId)],
);

export const stickers = sqliteTable(
  "stickers",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    mediaObjectId: text("media_object_id")
      .notNull()
      .references(() => mediaObjects.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("stickers_owner_id_idx").on(table.ownerId)],
);

export const diaryEntries = sqliteTable(
  "diary_entries",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    entryDate: text("entry_date").notNull(),
    documentJson: text("document_json", { mode: "json" }).notNull(),
    previewSnippet: text("preview_snippet"),
    previewThumbnailMediaObjectId: text("preview_thumbnail_media_object_id").references(
      () => mediaObjects.id,
    ),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("diary_entries_owner_entry_date_idx").on(table.ownerId, table.entryDate),
    index("diary_entries_owner_date_idx").on(table.ownerId, table.entryDate),
  ],
);
