/*
  Warnings:

  - Added the required column `rateId` to the `Time` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Project` MODIFY `estimatedTime` INTEGER NULL;

-- AlterTable
ALTER TABLE `Rate` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `Time` ADD COLUMN `rateId` INTEGER NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AddForeignKey
ALTER TABLE `Time` ADD CONSTRAINT `Time_rateId_fkey` FOREIGN KEY (`rateId`) REFERENCES `Rate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
