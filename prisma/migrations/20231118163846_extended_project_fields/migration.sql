/*
  Warnings:

  - Added the required column `createdAt` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Project` ADD COLUMN `createdAt` DATETIME(3) NOT NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `state` VARCHAR(191) NOT NULL,
    ADD COLUMN `targetDate` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
