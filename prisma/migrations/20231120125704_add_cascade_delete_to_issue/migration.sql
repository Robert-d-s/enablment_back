-- DropForeignKey
ALTER TABLE `Issue` DROP FOREIGN KEY `Issue_projectId_fkey`;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
