CREATE TABLE `releases` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`version` text NOT NULL,
	`notes` text NOT NULL,
	`url` text,
	`key` text,
	`filename` text,
	`created` integer NOT NULL
);
