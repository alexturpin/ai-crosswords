CREATE TABLE `answers` (
	`answer` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`example` text NOT NULL,
	`rating` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `friendships` (
	`low_user_id` integer NOT NULL,
	`high_user_id` integer NOT NULL,
	PRIMARY KEY(`high_user_id`, `low_user_id`),
	FOREIGN KEY (`low_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`high_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `puzzle_answers` (
	`puzzle_id` integer NOT NULL,
	`answer` text NOT NULL,
	`clue` text NOT NULL,
	PRIMARY KEY(`answer`, `puzzle_id`),
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`answer`) REFERENCES `answers`(`answer`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `puzzles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`date` text NOT NULL,
	`pack` text,
	`idx` integer NOT NULL,
	`grid` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `solves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`user_id` integer NOT NULL,
	`puzzle_id` integer NOT NULL,
	`time` integer NOT NULL,
	`streak` integer NOT NULL,
	`xp` integer NOT NULL,
	`moves` text NOT NULL,
	`geohash` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`email` text NOT NULL,
	`invite_code` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_invite_code_unique` ON `users` (`invite_code`);