/*
  Warnings:

  - Added the required column `totalElapsedTime` to the `Time` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Time` ADD COLUMN `totalElapsedTime` INTEGER NOT NULL;
