-- AlterTable
ALTER TABLE `chat_members` ADD COLUMN `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_archived` BOOLEAN NOT NULL DEFAULT false;
