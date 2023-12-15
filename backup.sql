-- MySQL dump 10.13  Distrib 8.1.0, for Linux (aarch64)
--
-- Host: localhost    Database: mynewdb
-- ------------------------------------------------------
-- Server version	8.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Issue`
--

DROP TABLE IF EXISTS `Issue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Issue` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dueDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priorityLabel` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigneeName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `projectName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamKey` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Issue_projectId_fkey` (`projectId`),
  CONSTRAINT `Issue_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Issue`
--

LOCK TABLES `Issue` WRITE;
/*!40000 ALTER TABLE `Issue` DISABLE KEYS */;
INSERT INTO `Issue` VALUES ('058096d5-d9cd-43c2-bb26-5820ea3670a1','2023-12-07T14:46:54.227Z','2023-12-07T14:46:54.227Z','Auth for user',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-21','jl@enablment.com','Frontend','Done','INT2','Internal tracking tool'),('08e09c66-e0cf-4edb-a1c9-4f8d38b8037e','2023-12-14T13:06:40.104Z','2023-12-14T14:40:02.270Z','[ERROR] - CSV Error when uploading private / corporate to wrong endpoint',NULL,'ce4efe62-1fb2-4c73-8437-4ab398232ee6','No priority','EVE-327','og@enablment.com','EVE December','Ready to Deploy','EVE','Eve technology'),('16f7a7b4-9743-449a-908d-da53ad3c5550','2023-12-07T14:52:55.509Z','2023-12-07T14:52:55.509Z','Customer project table',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-31','No Assignee','Frontend','Todo','INT2','Internal tracking tool'),('1ad6946c-77dd-4a2e-91cd-72e5d3f58882','2023-12-11T09:10:49.565Z','2023-12-11T09:10:49.565Z','Add apartments to listing',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-7','No Assignee','H5 V1','Backlog','H5','H5'),('34b43df6-87f2-4b77-90e0-b3b7670bb29e','2023-12-12T08:40:56.848Z','2023-12-12T08:40:56.848Z','Provide csv template',NULL,'ce4efe62-1fb2-4c73-8437-4ab398232ee6','No priority','EVE-325','No Assignee','EVE December','Todo','EVE','Eve technology'),('4168ce02-5338-4fe6-a16d-6eacba6a2165','2023-12-07T14:51:17.652Z','2023-12-07T14:51:17.652Z','Customer login page',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-29','No Assignee','Frontend','Todo','INT2','Internal tracking tool'),('59a84d09-9ead-4e47-a90e-92e58bc10dcc','2023-12-07T14:55:18.878Z','2023-12-07T14:55:18.878Z','Rates db',NULL,'457b59e3-742c-4e13-beaf-95e5e38d3dbb','No priority','INT2-32','jl@enablment.com','backend','Done','INT2','Internal tracking tool'),('62e1c048-1385-4b3a-8ba5-037ac8473154','2023-12-14T09:40:09.100Z','2023-12-15T10:38:04.535Z','Timer manual edit',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-34','jl@enablment.com','Frontend','Done','INT2','Internal tracking tool'),('638ed1b8-8258-49c1-aff3-bacbf9074045','2023-08-05T12:01:17.368Z','2023-12-14T21:55:32.195Z','Create Renewal Overview Subpage',NULL,'35356e0b-cf00-499e-8220-dfd865f273e0','No priority','EVE-32','David Lin','Frontend design','Canceled','EVE','Eve technology'),('68672c2f-2b9a-4ccd-ba66-05e150ea28d7','2023-12-11T09:09:38.143Z','2023-12-11T09:09:38.143Z','Integrating google maps',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-5','No Assignee','H5 V1','Backlog','H5','H5'),('68e9bbf0-eba2-44e4-a9da-6fc348392712','2023-12-11T09:11:10.692Z','2023-12-11T09:11:10.692Z','Adding more content',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-8','No Assignee','H5 V1','Backlog','H5','H5'),('6f00030c-7aaa-4b6e-9685-09384a6d3442','2023-12-15T10:41:31.092Z','2023-12-15T10:42:58.795Z','No entries in the future',NULL,'457b59e3-742c-4e13-beaf-95e5e38d3dbb','No priority','INT2-36','lp@enablment.com','backend','Todo','INT2','Internal tracking tool'),('7239dd29-2ab0-4d42-9c41-4f8fe97bbdac','2023-12-15T06:16:51.789Z','2023-12-15T09:43:35.151Z','[ERROR] - Make sure that customer financials is the latest before creating auction',NULL,'ce4efe62-1fb2-4c73-8437-4ab398232ee6','No priority','EVE-328','sh@enablment.com','EVE December','Ready to Deploy','EVE','Eve technology'),('7d11c16e-9120-4ad8-a570-ba01f1d6e91d','2023-12-07T14:49:14.186Z','2023-12-14T09:40:20.531Z','Time Tracking',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-24','jl@enablment.com','Frontend','Done','INT2','Internal tracking tool'),('809476b4-94ef-40be-afab-e66f4be89157','2023-12-08T10:28:00.567Z','2023-12-11T09:08:59.376Z','Figma mockups',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-1','No Assignee','H5 V1','Done','H5','H5'),('816b3fba-1588-4195-9eeb-7e9ee80d827c','2023-12-11T09:09:25.449Z','2023-12-11T09:09:28.814Z','Mockups for specific apartment page',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-4','No Assignee','H5 V1','Backlog','H5','H5'),('85ec1b9b-1bd4-4051-b245-681f1f686391','2023-12-11T09:06:27.619Z','2023-12-11T09:08:50.267Z','Designing details',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-3','No Assignee','H5 V1','Todo','H5','H5'),('87025de3-67cc-4c32-b639-c4c02584c841','2023-12-07T14:47:17.472Z','2023-12-07T14:47:17.472Z','Auth for customer',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-22','No Assignee','Frontend','Todo','INT2','Internal tracking tool'),('8f8e1069-3944-4ef7-874e-b679e2f32ce7','2023-12-07T14:56:18.230Z','2023-12-14T09:40:22.899Z','Entries for time tracking db',NULL,'457b59e3-742c-4e13-beaf-95e5e38d3dbb','No priority','INT2-33','jl@enablment.com','backend','Done','INT2','Internal tracking tool'),('96772862-08e5-4360-b9b1-0fb29549ff9f','2023-12-07T14:49:34.282Z','2023-12-07T14:54:41.379Z','Rates',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-25','jl@enablment.com','Frontend','Done','INT2','Internal tracking tool'),('9cc6ba7c-010a-4ce5-bcc9-87e929384ebf','2023-12-07T14:47:35.652Z','2023-12-07T14:47:35.652Z','Auth for admin',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-23','No Assignee','Frontend','Todo','INT2','Internal tracking tool'),('c10d5d5f-17f2-4dcb-95df-dfb45c2c3198','2023-12-14T11:39:36.766Z','2023-12-14T13:06:08.670Z','[ERROR] - Auctionjob only altering 1 auction',NULL,'ce4efe62-1fb2-4c73-8437-4ab398232ee6','No priority','EVE-326','og@enablment.com','EVE December','Done','EVE','Eve technology'),('d6acbca2-d46c-4292-b189-9ff3c61945c3','2023-12-11T09:09:46.254Z','2023-12-11T09:09:46.254Z','Danish/English',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-6','No Assignee','H5 V1','Backlog','H5','H5'),('d6deba05-fa8e-4724-b516-5472b0da1cf6','2023-12-11T09:04:36.502Z','2023-12-11T09:08:51.986Z','Mobile responsiveness',NULL,'5f5e5705-c3e7-46ea-bcca-3e5ed084a91f','No priority','H5-2','No Assignee','H5 V1','Todo','H5','H5'),('da54b2f7-1f95-4caa-8ccf-2e0ae502ce2e','2023-12-15T09:55:41.394Z','2023-12-15T09:55:41.394Z','Research Search/Filter/Pagination',NULL,'ce4efe62-1fb2-4c73-8437-4ab398232ee6','No priority','EVE-329','sh@enablment.com','EVE December','In Progress','EVE','Eve technology'),('e287f03d-1c2b-498f-bf35-6ad6f7b4cf6d','2023-12-07T14:49:55.560Z','2023-12-07T14:54:43.066Z','Teams',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-26','jl@enablment.com','Frontend','Done','INT2','Internal tracking tool'),('e6b4b2fe-1377-4cd9-929e-52f095994d0f','2023-12-07T14:50:58.135Z','2023-12-07T14:50:58.135Z','User login page',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-28','No Assignee','Frontend','Todo','INT2','Internal tracking tool'),('ee5dd63e-9640-4f0d-8874-17e3e5dff695','2023-12-07T14:50:06.892Z','2023-12-14T09:40:18.263Z','Calendar',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-27','jl@enablment.com','Frontend','Done','INT2','Internal tracking tool'),('f6c010ab-0ae8-491c-b5ac-40b1338e2a0b','2023-12-07T14:52:06.766Z','2023-12-07T14:52:06.766Z','Admin projects table',NULL,'c61dab65-c149-4c20-94dc-7550dc7b4dff','No priority','INT2-30','No Assignee','Frontend','Todo','INT2','Internal tracking tool');
/*!40000 ALTER TABLE `Issue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Label`
--

DROP TABLE IF EXISTS `Label`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Label` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issueId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Label_issueId_fkey` (`issueId`),
  CONSTRAINT `Label_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Label`
--

LOCK TABLES `Label` WRITE;
/*!40000 ALTER TABLE `Label` DISABLE KEYS */;
INSERT INTO `Label` VALUES ('6213e923-9401-4d2f-962d-d86f586717f5','#5e6ad2','Backend','015f9357-e175-4205-9fd5-7bcb339305c9','08e09c66-e0cf-4edb-a1c9-4f8d38b8037e'),('7b822436-b775-431e-a9ad-8e248ae1ce0d','#26b5ce','MVP',NULL,'34b43df6-87f2-4b77-90e0-b3b7670bb29e');
/*!40000 ALTER TABLE `Label` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Project`
--

DROP TABLE IF EXISTS `Project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Project` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estimatedTime` int DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `startDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `targetDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Project_teamId_fkey` (`teamId`),
  CONSTRAINT `Project_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Project`
--

LOCK TABLES `Project` WRITE;
/*!40000 ALTER TABLE `Project` DISABLE KEYS */;
INSERT INTO `Project` VALUES ('34bf4a37-b54a-4276-b683-6fac9f81ad00',NULL,'CaC','11d9b2c2-893b-4ab0-8c03-c49d04225cd7','2023-09-23T17:48:04.110Z','dsfss',NULL,'planned',NULL,'2023-12-07T14:45:51.401Z'),('35356e0b-cf00-499e-8220-dfd865f273e0',NULL,'Frontend design','6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','2023-05-02T06:36:06.848Z','','2023-07-17','started','2023-09-15','2023-12-13T12:16:41.210Z'),('376e5ef5-ee9e-4b3b-b14d-6c471b4f21e5',NULL,'Version 1 MVP','6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','2023-08-08T12:08:53.686Z','','2023-08-25','planned','2023-11-10','2023-12-14T09:56:50.415Z'),('457b59e3-742c-4e13-beaf-95e5e38d3dbb',NULL,'backend','11d9b2c2-893b-4ab0-8c03-c49d04225cd7','2023-12-07T14:53:19.454Z','',NULL,'planned',NULL,'2023-12-07T14:54:02.623Z'),('4a05b720-42c0-479c-8c06-7ca949644316',NULL,'[EXTERNAL API] DMR Integration','6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','2023-08-14T08:50:29.811Z','','2023-09-01','started','2023-10-13','2023-12-11T12:47:43.545Z'),('5f5e5705-c3e7-46ea-bcca-3e5ed084a91f',NULL,'H5 V1','c6e88a9b-95cd-4be0-b4f4-b49a4f707eff','2023-12-08T10:27:36.987Z','Version 1 of the H5 current website - redesign',NULL,'planned',NULL,'2023-12-08T10:27:36.987Z'),('79c2300a-eafb-400d-b339-5e50d61606e8',NULL,'AaA','11d9b2c2-893b-4ab0-8c03-c49d04225cd7','2023-09-23T17:47:47.032Z','aaaaaa',NULL,'planned',NULL,'2023-11-19T07:22:10.701Z'),('88952cb1-8a0f-478b-85b4-c7da38ed93b7',NULL,'[350] Frontend','6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','2023-04-08T09:14:21.989Z','','2023-04-17','canceled','2023-08-31','2023-12-14T21:35:24.068Z'),('c61dab65-c149-4c20-94dc-7550dc7b4dff',NULL,'Frontend','11d9b2c2-893b-4ab0-8c03-c49d04225cd7','2023-12-07T14:46:04.444Z','','2023-12-07','started',NULL,'2023-12-07T14:46:10.181Z'),('ce4efe62-1fb2-4c73-8437-4ab398232ee6',NULL,'EVE December','6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','2023-11-13T09:40:37.746Z','','2023-11-13','started',NULL,'2023-12-11T09:58:43.755Z'),('d916db40-c210-4422-9375-c13e26d7816b',NULL,'BaB','11d9b2c2-893b-4ab0-8c03-c49d04225cd7','2023-09-23T17:47:56.479Z','efws',NULL,'planned',NULL,'2023-11-19T07:22:32.013Z'),('eacbc05b-8618-4181-a951-180d19704b4b',NULL,'Auction System','6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','2023-06-22T11:39:10.888Z','Real-time auction implementation','2023-09-01','started','2023-10-13','2023-12-14T10:36:43.041Z'),('ee35c43e-71f4-413e-87c9-912c6f1f0d9a',NULL,'jhg','767bf488-99f4-4219-98cb-a672073e9aa6','2023-12-05T21:52:44.394Z','',NULL,'backlog',NULL,'2023-12-05T21:52:44.394Z'),('fe9af562-5d15-4803-a0d5-3567e166d8db',NULL,'proj test','53ec1c05-4694-4eac-8309-0c12a92c2938','2023-12-03T15:56:21.281Z','',NULL,'backlog',NULL,'2023-12-03T15:56:21.281Z');
/*!40000 ALTER TABLE `Project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Rate`
--

DROP TABLE IF EXISTS `Rate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Rate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teamId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Rate_teamId_fkey` (`teamId`),
  CONSTRAINT `Rate_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rate`
--

LOCK TABLES `Rate` WRITE;
/*!40000 ALTER TABLE `Rate` DISABLE KEYS */;
INSERT INTO `Rate` VALUES (39,'design','11d9b2c2-893b-4ab0-8c03-c49d04225cd7',500),(40,'design','53ec1c05-4694-4eac-8309-0c12a92c2938',500);
/*!40000 ALTER TABLE `Rate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Team`
--

DROP TABLE IF EXISTS `Team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Team` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Team`
--

LOCK TABLES `Team` WRITE;
/*!40000 ALTER TABLE `Team` DISABLE KEYS */;
INSERT INTO `Team` VALUES ('11d9b2c2-893b-4ab0-8c03-c49d04225cd7','Internal tracking tool'),('4252dfaf-48e8-4215-b304-f31c687d8a42','duck lovers'),('53ec1c05-4694-4eac-8309-0c12a92c2938','TEST'),('6cf7f0f3-5639-4387-bcf5-e3fc1bc77de8','Eve technology'),('767bf488-99f4-4219-98cb-a672073e9aa6','Test 2'),('b2264c89-a41e-4a77-abad-0ed14da2c1f8','Lalala'),('c6e88a9b-95cd-4be0-b4f4-b49a4f707eff','H5');
/*!40000 ALTER TABLE `Team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Time`
--

DROP TABLE IF EXISTS `Time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Time` (
  `id` int NOT NULL AUTO_INCREMENT,
  `startTime` datetime(3) NOT NULL,
  `endTime` datetime(3) DEFAULT NULL,
  `userId` int NOT NULL,
  `projectId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rateId` int NOT NULL,
  `totalElapsedTime` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Time_userId_fkey` (`userId`),
  KEY `Time_rateId_fkey` (`rateId`),
  KEY `Time_projectId_fkey` (`projectId`),
  CONSTRAINT `Time_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Time_rateId_fkey` FOREIGN KEY (`rateId`) REFERENCES `Rate` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Time_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Time`
--

LOCK TABLES `Time` WRITE;
/*!40000 ALTER TABLE `Time` DISABLE KEYS */;
INSERT INTO `Time` VALUES (24,'2023-12-03 07:57:17.000','2023-12-03 07:57:25.000',4,'34bf4a37-b54a-4276-b683-6fac9f81ad00',39,6187),(25,'2023-12-03 06:00:00.000','2023-12-03 15:57:38.000',4,'fe9af562-5d15-4803-a0d5-3567e166d8db',40,35855860),(26,'2023-12-03 03:04:00.000','2023-12-03 16:05:52.000',4,'fe9af562-5d15-4803-a0d5-3567e166d8db',40,46886989),(27,'2023-12-03 14:00:00.000','2023-12-03 16:07:52.000',4,'fe9af562-5d15-4803-a0d5-3567e166d8db',40,7671781),(28,'2023-12-05 13:52:34.000','2023-12-05 13:52:48.000',4,'fe9af562-5d15-4803-a0d5-3567e166d8db',40,7012),(29,'2023-12-11 20:40:24.000','2023-12-11 20:40:46.000',4,'c61dab65-c149-4c20-94dc-7550dc7b4dff',39,27636002),(30,'2023-12-12 11:43:02.000','2023-12-12 11:43:46.000',4,'457b59e3-742c-4e13-beaf-95e5e38d3dbb',39,11594127),(31,'2023-12-13 10:56:48.000','2023-12-13 10:56:55.000',4,'34bf4a37-b54a-4276-b683-6fac9f81ad00',39,5597),(32,'2023-12-13 08:00:00.000','2023-12-13 10:58:57.000',4,'c61dab65-c149-4c20-94dc-7550dc7b4dff',39,10735007),(33,'2023-12-14 14:10:00.000','2023-12-14 14:44:44.000',4,'34bf4a37-b54a-4276-b683-6fac9f81ad00',39,2040624),(34,'2023-12-14 17:41:41.000','2023-12-14 17:42:05.000',4,'34bf4a37-b54a-4276-b683-6fac9f81ad00',39,7119),(35,'2023-12-14 19:50:00.000','2023-12-14 20:16:47.000',4,'457b59e3-742c-4e13-beaf-95e5e38d3dbb',39,1600758);
/*!40000 ALTER TABLE `Time` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','ENABLER','COLLABORATOR','PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (4,'rs@enablment.com','$2b$10$eGscm/5ENmsxiVIEhikzsezxcohtKwkDXNl9nP9Lj3vioObOrNWWC','ADMIN'),(5,'rs@gmail.com','$2b$10$SgDhP45B4R.IJYQugqNV6Ox0jmVZH/wJsfgfoaSVckaUszF9WrqVi','ENABLER'),(7,'rr@gmail.com','$2b$10$xAH9kfT1aB2LXZ4Ew3YlHO/u1XloKmNxJO3MF3HQFCLvxVkFTa9gq','PENDING');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserTeam`
--

DROP TABLE IF EXISTS `UserTeam`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserTeam` (
  `userId` int NOT NULL,
  `teamId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`userId`,`teamId`),
  KEY `UserTeam_teamId_fkey` (`teamId`),
  CONSTRAINT `UserTeam_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `UserTeam_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserTeam`
--

LOCK TABLES `UserTeam` WRITE;
/*!40000 ALTER TABLE `UserTeam` DISABLE KEYS */;
INSERT INTO `UserTeam` VALUES (4,'11d9b2c2-893b-4ab0-8c03-c49d04225cd7'),(4,'53ec1c05-4694-4eac-8309-0c12a92c2938'),(5,'767bf488-99f4-4219-98cb-a672073e9aa6'),(5,'b2264c89-a41e-4a77-abad-0ed14da2c1f8');
/*!40000 ALTER TABLE `UserTeam` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1cc71bf0-6d69-40d2-be60-9af10509ef90','60f7c40afb66794ec468d6a2c8ebb24e0e59353bc7e5a4c2da4cfdccc139085b','2023-11-19 09:41:42.526','20231119094114_labels_issues_relation',NULL,NULL,'2023-11-19 09:41:42.480',1),('1db9294c-b9b9-46fa-83a4-4a571ce7eebd','da73fee6462f67f9036a5c83e38033079f9d651e40c04c29adf3af3cc6640efe','2023-11-20 12:57:04.681','20231120125704_add_cascade_delete_to_issue',NULL,NULL,'2023-11-20 12:57:04.655',1),('248bdf04-d137-4e69-a0e1-b8604c1e0264','042415177c6185a94514514ca7bba83da19fe3232a08e573b3429b9142b3ced4','2023-11-18 16:38:46.015','20230824074022_initial',NULL,NULL,'2023-11-18 16:38:45.955',1),('36c7d0b1-48d4-49f6-85c1-1ef145b421a1','ceb842c5f0acfa4fc215aeb90b10c1cffa6464ed055ef6a06feeeb0e40be335f','2023-11-18 16:38:46.062','20231019084632_cascade_delete_for_team_sync',NULL,NULL,'2023-11-18 16:38:46.026',1),('3aaef26c-1311-4470-b23d-dca1e4aac606','de33597cd341c6f015c91c97335b126f56db0061dda58079186cbf42ceea2bb6','2023-11-19 21:44:42.190','20231119214442_relations',NULL,NULL,'2023-11-19 21:44:42.157',1),('6031fd82-bf23-48c5-baab-1b1fd900eb1f','63657de2675fce2348cd4e92211c874e7295351d81ab1643263af571f4395ceb','2023-12-03 16:43:25.362','20231203164325_user_team_assosiation',NULL,NULL,'2023-12-03 16:43:25.309',1),('73c9b57f-31c1-44c4-bcc3-25fab2c28970','bbbb3d1ce9223a79c5df657174324189d16bb78f60a519ed7b955d6058f5f124','2023-11-18 16:38:46.503','20231118163846_extended_project_fields',NULL,NULL,'2023-11-18 16:38:46.488',1),('8708c2b5-2fc4-4dd0-9bb1-e1d9ae349d7c','34e5855bee0db020bcfb828a8681db4037af0ff4a9a3ccf2cad1280f75385fbb','2023-11-30 12:18:48.522','20231130121848_add_role_to_user',NULL,NULL,'2023-11-30 12:18:48.471',1),('96e01a31-0834-4c2a-8128-3d34e23869f4','19b3591993e29db279a598c3597ff545463676ce94f0c969eeb87bbddad312e6','2023-11-18 16:38:45.954','20230503145827_test',NULL,NULL,'2023-11-18 16:38:45.859',1),('b3968ebb-9790-4d28-bb4b-4356a04b9b66','8b666fc2a8f61ae4d905e1f5aa44da496efd1a6a9b122c76de5855b3686de909','2023-11-18 16:38:46.024','20230923171635_add_total_elapsed_time',NULL,NULL,'2023-11-18 16:38:46.017',1),('b7312ec8-819b-4180-afe2-6c3bc914da0d','875f446bcbce016caf67260557b298b66ea78d989353ac5c7da98b285ea6fc4a','2023-11-18 17:20:09.282','20231118172009_update_project_date_fields',NULL,NULL,'2023-11-18 17:20:09.264',1),('d004a37d-654b-4a14-8fda-21f6208cbd8e','e263258442102088c2bd16d8e4bd4974f81b41e3db9cf52c69f2e010dfee8aed','2023-11-18 20:05:33.511','20231118200533_add_issue_table',NULL,NULL,'2023-11-18 20:05:33.485',1),('ee03eafa-6cc4-4cfa-8e15-2fe8bc67ff12','d99bf91a2b2067813b4aadfad32c378cc1a7ebe4ab74c5c24c177ecc8e8d3a60','2023-11-18 22:49:10.861','20231118224910_asignee_fix',NULL,NULL,'2023-11-18 22:49:10.841',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-12-15 11:41:07
