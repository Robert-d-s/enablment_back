-- CreateTable
CREATE TABLE `Label` (
    `id` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_IssueToLabel` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_IssueToLabel_AB_unique`(`A`, `B`),
    INDEX `_IssueToLabel_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_IssueToLabel` ADD CONSTRAINT `_IssueToLabel_A_fkey` FOREIGN KEY (`A`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_IssueToLabel` ADD CONSTRAINT `_IssueToLabel_B_fkey` FOREIGN KEY (`B`) REFERENCES `Label`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
