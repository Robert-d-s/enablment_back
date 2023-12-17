/*
  Warnings:

  - The primary key for the `Label` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `internalId` to the `Label` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Label` DROP PRIMARY KEY,
    ADD COLUMN `internalId` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`internalId`);

-- CreateIndex
CREATE INDEX `idx_label_issue` ON `Label`(`id`, `issueId`);
