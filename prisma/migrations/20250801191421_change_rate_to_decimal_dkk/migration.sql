-- Convert rate column from Int (øre) to Decimal(10,2) (DKK)
-- This migration converts existing rates from øre to krona by dividing by 100
-- Example: 5000 øre becomes 50.00 DKK

-- First, add a temporary column to store the converted values
ALTER TABLE `Rate` ADD COLUMN `rate_decimal` DECIMAL(10,2);

-- Convert existing data from øre to DKK (divide by 100)
UPDATE `Rate` SET `rate_decimal` = `rate` / 100;

-- Drop the old column and rename the new one
ALTER TABLE `Rate` DROP COLUMN `rate`;
ALTER TABLE `Rate` CHANGE COLUMN `rate_decimal` `rate` DECIMAL(10,2) NOT NULL;
