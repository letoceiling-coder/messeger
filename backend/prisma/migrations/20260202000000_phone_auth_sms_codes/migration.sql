-- AlterTable: User - add phone, make email/passwordHash optional for phone auth
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(191) NULL;
ALTER TABLE `users` ADD UNIQUE INDEX `users_phone_key`(`phone`);

-- Make email and password_hash nullable (keep existing data)
ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(191) NULL;
ALTER TABLE `users` MODIFY COLUMN `password_hash` VARCHAR(191) NULL;

-- CreateTable: SmsCode for storing verification codes
CREATE TABLE `sms_codes` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sms_codes_phone_idx`(`phone`),
    INDEX `sms_codes_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
