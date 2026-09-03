CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`name` text NOT NULL,
	`meal` text NOT NULL,
	`calories` real DEFAULT 0 NOT NULL,
	`protein` real DEFAULT 0 NOT NULL,
	`fat` real DEFAULT 0 NOT NULL,
	`carbs` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` text NOT NULL,
	`calories` real DEFAULT 2100 NOT NULL,
	`protein` real DEFAULT 120 NOT NULL,
	`fat` real DEFAULT 70 NOT NULL,
	`carbs` real DEFAULT 240 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goals_client_idx` ON `goals` (`client_id`);