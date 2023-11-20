/*
  Warnings:

  - You are about to drop the `_IssueToLabel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `issueId` to the `Label` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `_IssueToLabel` DROP FOREIGN KEY `_IssueToLabel_A_fkey`;

-- DropForeignKey
ALTER TABLE `_IssueToLabel` DROP FOREIGN KEY `_IssueToLabel_B_fkey`;

-- AlterTable
ALTER TABLE `Label` ADD COLUMN `issueId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `_IssueToLabel`;

-- AddForeignKey
ALTER TABLE `Label` ADD CONSTRAINT `Label_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
