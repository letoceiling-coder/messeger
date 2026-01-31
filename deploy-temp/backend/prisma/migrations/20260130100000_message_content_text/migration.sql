-- AlterTable: allow long messages (e.g. pasted logs)
ALTER TABLE `messages` MODIFY COLUMN `content` TEXT NOT NULL;
ALTER TABLE `messages` MODIFY COLUMN `encrypted_content` TEXT NULL;
