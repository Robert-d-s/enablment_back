-- CreateIndex
CREATE INDEX `idx_user_role` ON `User`(`role`);

-- CreateIndex
CREATE INDEX `idx_user_email_role` ON `User`(`email`, `role`);

-- CreateIndex
CREATE INDEX `idx_userteam_userid` ON `UserTeam`(`userId`);

-- RenameIndex
ALTER TABLE `UserTeam` RENAME INDEX `UserTeam_teamId_fkey` TO `idx_userteam_teamid`;
