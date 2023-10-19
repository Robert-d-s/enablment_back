-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_teamId_fkey`;

-- DropForeignKey
ALTER TABLE `Rate` DROP FOREIGN KEY `Rate_teamId_fkey`;

-- AddForeignKey
ALTER TABLE `Rate` ADD CONSTRAINT `Rate_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
