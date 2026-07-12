import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const owners = sqliteTable("owners", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull(),
});

export const oauthIdentities = sqliteTable(
  "oauth_identities",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    provider: text("provider", { enum: ["google", "github"] }).notNull(),
    providerSubject: text("provider_subject").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("oauth_identities_provider_subject_idx").on(table.provider, table.providerSubject),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("sessions_owner_id_idx").on(table.ownerId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const mediaObjects = sqliteTable(
  "media_objects",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["image", "sticker", "thumbnail"] }).notNull(),
    r2Key: text("r2_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("media_objects_owner_id_idx").on(table.ownerId)],
);

export const diaryEntries = sqliteTable(
  "diary_entries",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
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
