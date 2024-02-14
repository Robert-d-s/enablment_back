-- DropForeignKey
ALTER TABLE `Time` DROP FOREIGN KEY `Time_rateId_fkey`;

-- AlterTable
ALTER TABLE `Time` MODIFY `rateId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Time` ADD CONSTRAINT `Time_rateId_fkey` FOREIGN KEY (`rateId`) REFERENCES `Rate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
