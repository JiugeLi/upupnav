-- 创建用户表
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar` text,
	`google_id` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_login` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_unique` ON `users` (`google_id`);
--> statement-breakpoint

-- 创建默认管理员用户（用于迁移现有数据）
INSERT INTO users (id, email, name, google_id, created_at) 
VALUES (1, 'admin@local', 'Admin', NULL, CURRENT_TIMESTAMP);
--> statement-breakpoint

-- 为 groups 表添加 user_id 列（默认值为 1，关联到管理员）
ALTER TABLE groups ADD `user_id` integer NOT NULL DEFAULT 1;
--> statement-breakpoint

-- 为 websites 表添加 user_id 列（默认值为 1，关联到管理员）
ALTER TABLE websites ADD `user_id` integer NOT NULL DEFAULT 1;