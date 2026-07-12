CREATE TABLE `stickers` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`media_object_id` text NOT NULL,
	`label` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_object_id`) REFERENCES `media_objects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stickers_owner_id_idx` ON `stickers` (`owner_id`);