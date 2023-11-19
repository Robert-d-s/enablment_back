-- CreateTable
CREATE TABLE `Issue` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` VARCHAR(191) NOT NULL,
    `updatedAt` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `dueDate` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `priorityLabel` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `assigneeName` VARCHAR(191) NOT NULL,
    `projectName` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `teamKey` VARCHAR(191) NOT NULL,
    `teamName` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
