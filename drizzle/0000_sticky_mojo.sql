CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`year` text DEFAULT '' NOT NULL,
	`date` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`file` text DEFAULT '' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entries_kind_year` ON `entries` (`kind`,`year`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`first` text NOT NULL,
	`last` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`created` integer NOT NULL,
	`ip` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `messages_ip_created` ON `messages` (`ip`,`created`);--> statement-breakpoint
CREATE TABLE `contact_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`ip` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tokens_ip_created` ON `contact_tokens` (`ip`,`created`);