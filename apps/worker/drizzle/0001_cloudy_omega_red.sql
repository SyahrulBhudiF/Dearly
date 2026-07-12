CREATE TABLE `media_objects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`r2_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_objects_r2_key_unique` ON `media_objects` (`r2_key`);--> statement-breakpoint
CREATE INDEX `media_objects_owner_id_idx` ON `media_objects` (`owner_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_diary_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`document_json` text NOT NULL,
	`preview_snippet` text,
	`preview_thumbnail_media_object_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`preview_thumbnail_media_object_id`) REFERENCES `media_objects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_diary_entries`("id", "owner_id", "entry_date", "document_json", "preview_snippet", "preview_thumbnail_media_object_id", "updated_at") SELECT "id", "owner_id", "entry_date", "document_json", "preview_snippet", "preview_thumbnail_media_object_id", "updated_at" FROM `diary_entries`;--> statement-breakpoint
DROP TABLE `diary_entries`;--> statement-breakpoint
ALTER TABLE `__new_diary_entries` RENAME TO `diary_entries`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `diary_entries_owner_entry_date_idx` ON `diary_entries` (`owner_id`,`entry_date`);--> statement-breakpoint
CREATE INDEX `diary_entries_owner_date_idx` ON `diary_entries` (`owner_id`,`entry_date`);