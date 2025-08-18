-- MySQL dump 10.13  Distrib 8.4.4, for Linux (aarch64)
--
-- Host: localhost    Database: mynewdb
-- ------------------------------------------------------
-- Server version	8.4.4

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
  `teamKey` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `teamName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Issue_projectId_fkey` (`projectId`),
  KEY `Issue_teamKey_fkey` (`teamKey`),
  CONSTRAINT `Issue_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Issue_teamKey_fkey` FOREIGN KEY (`teamKey`) REFERENCES `Team` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Issue`
--

LOCK TABLES `Issue` WRITE;
/*!40000 ALTER TABLE `Issue` DISABLE KEYS */;
INSERT INTO `Issue` VALUES ('0afcf4f0-4176-4bf8-94e3-c65ddc1dba17','2025-03-07T15:17:15.293Z','2025-03-19T06:58:36.705Z','frontend issue',NULL,'42146e7e-2c81-4dc0-a46a-41fe3f3b0c28','No priority','TEA-1','Robert Stoica','Team-Test Project 1','Canceled','7dcefd42-6ac1-496e-9856-89413eb5b4ca','Team-Test'),('0d88cba1-7f86-46fb-a5d1-1f83ad971394','2024-03-01T11:56:07.620Z','2024-03-01T11:56:07.620Z','yert',NULL,'5357aa9c-77fe-4329-91e7-be89b2b53c12','No priority','INT-8','No assignee','Backend','Backlog','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('0fe95a1d-b58d-4677-bb54-a3079c42bb65','2024-01-14T07:59:13.105Z','2025-03-06T19:54:27.908Z','Issue test 22',NULL,'0155f781-9d6e-4700-a208-544773e02775','Low','ENA-11','Robert Stoica','Project Test 2','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('26a40b4f-f729-43e1-bb0d-1e15629512e3','2023-10-26T12:46:17.413Z','2024-01-14T08:38:48.936Z','Connect GitHub or GitLab',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Medium','ENA-4','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('3a26231a-19a6-41bb-a781-f567dff6bfa5','2025-02-20T19:40:19.413Z','2025-03-07T14:21:00.770Z','test new year!!',NULL,'d3497f91-2231-4ad7-93be-61a8850a3367','No priority','INT-11','No assignee','Frontend','In Progress','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('3aa35f92-1416-4f03-a3de-c1512927850c','2025-03-06T07:49:25.872Z','2025-03-06T07:49:25.872Z','completed',NULL,'2df3ced1-5166-467d-901c-c55adc8af3d6','No priority','INT-13','No assignee','completed','Backlog','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('4bf5612f-2676-4d00-a355-10d353815bc5','2025-03-07T13:51:50.556Z','2025-04-09T15:26:18.732Z','3000',NULL,'5357aa9c-77fe-4329-91e7-be89b2b53c12','No priority','INT-14','No assignee','Backend','In Progress','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('4c880a9f-d026-452c-94d5-3dff950a623d','2024-01-14T09:23:38.546Z','2024-02-15T10:13:15.721Z','Interface Design',NULL,'d3497f91-2231-4ad7-93be-61a8850a3367','No priority','INT-1','Robert Stoica','Frontend','Backlog','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('529bc182-7c78-4516-845e-fdbed41c93e7','2024-01-14T07:50:32.061Z','2024-01-31T17:22:29.223Z','issue test','2024-02-07','9efd712c-b124-4d84-9b7b-8fcc9287ce1d','Medium','ENA-10','robe3750@stud.kea.dk','Project test!','In Progress','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('5e9821ca-1b11-44ac-9a39-6ac671a6ce78','2023-10-26T12:46:17.413Z','2024-01-14T08:38:43.282Z','Try 3 ways to navigate Linear: Command line, keyboard or mouse',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Medium','ENA-2','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('657c56b5-35c5-4b75-af75-0b4050d01755','2023-10-26T12:46:17.413Z','2024-01-14T08:39:07.661Z','Invite your teammates',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Low','ENA-8','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('6c9b337a-9b81-44fb-a29c-7266ca642e16','2023-10-26T12:46:17.413Z','2024-01-14T08:38:52.278Z','Customize settings',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Medium','ENA-5','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('700f22fe-125f-4a13-9349-2d9138192783','2024-01-14T09:24:10.863Z','2024-01-14T11:02:39.493Z','GraphQL',NULL,'5357aa9c-77fe-4329-91e7-be89b2b53c12','No priority','INT-2','robe3750@stud.kea.dk','Backend','Backlog','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('7a1d3a16-48be-4d4e-8809-f3d8d42a9946','2023-10-26T12:46:17.413Z','2024-01-14T08:38:46.250Z','Connect to Slack',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Medium','ENA-3','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('7c410e92-57e1-41c1-8bdc-71bc35510826','2023-10-26T12:46:17.413Z','2024-01-14T08:39:02.867Z','Use Projects to organize work for features or releases',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Low','ENA-7','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('a371913d-1d46-4cf3-87f0-7cb3a67388bc','2025-04-09T15:29:32.423Z','2025-04-10T12:24:44.409Z','apple-bad',NULL,'05e34067-6bbe-4a36-a844-14cd53f633cf','Urgent','TEA2-2','Robert Stoica','Team-Test 2 projectt','Canceled','3db31a46-6209-41cf-be73-1bf8a057f536','Team-Test 2'),('a68bb215-9596-43e9-ba73-0ca0e2697630','2025-03-12T16:58:43.803Z','2025-04-09T21:14:28.308Z','team test 22',NULL,'05e34067-6bbe-4a36-a844-14cd53f633cf','Medium','TEA2-1','Robert Stoica','Team-Test 2 projectt','Canceled','3db31a46-6209-41cf-be73-1bf8a057f536','Team-Test 2'),('b0e78907-269d-49a2-9fcd-7c7821f44211','2025-03-06T07:44:55.424Z','2025-03-06T07:45:46.715Z','design',NULL,'d3497f91-2231-4ad7-93be-61a8850a3367','No priority','INT-12','No assignee','Frontend','Backlog','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('b36d8605-4e66-4aa2-a6ff-14a7b4f395c7','2023-10-26T12:46:17.413Z','2024-01-31T11:55:14.223Z','Welcome to Linear 👋',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Medium','ENA-1','robe3750@stud.kea.dk','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('b6017ae2-f716-482c-8419-4e7f90bd3994','2024-01-31T21:00:43.278Z','2025-03-12T09:11:51.667Z','bla bla',NULL,'d3497f91-2231-4ad7-93be-61a8850a3367','Low','INT-5','robe3750@stud.kea.dk','Frontend','In Progress','33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('c3e1fa35-3d2e-411e-897d-9e5ff80ad01f','2023-10-26T12:46:17.413Z','2024-01-14T08:39:11.751Z','Next steps',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Low','ENA-9','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('ca8b32ee-82a7-42de-8c17-0e615af40ef3','2023-10-26T12:46:17.413Z','2024-01-14T08:38:59.120Z','Use Cycles to focus work over n–weeks',NULL,'c4624a1e-d384-48ab-8248-b2687e098b2c','Low','ENA-6','No assignee','Welcome to Linear','Todo','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made');
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
  `internalId` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`internalId`),
  KEY `idx_label_issue` (`id`,`issueId`),
  KEY `Label_issueId_fkey` (`issueId`),
  CONSTRAINT `Label_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Label`
--

LOCK TABLES `Label` WRITE;
/*!40000 ALTER TABLE `Label` DISABLE KEYS */;
INSERT INTO `Label` VALUES ('c667bee6-e25d-46c2-a50e-95ed46fcbd0a','#f2994a','Coding',NULL,'a371913d-1d46-4cf3-87f0-7cb3a67388bc',1),('3cc90964-31b1-4101-8cec-cd7bbb5a5f83','#f7c8c1','Design',NULL,'a68bb215-9596-43e9-ba73-0ca0e2697630',2),('45bd09f3-0d43-4350-9ed1-90fc66986b48','#4EA7FC','Improvement',NULL,'a68bb215-9596-43e9-ba73-0ca0e2697630',3),('d9191277-3a87-4293-8e7a-a53f53f75b76','#EB5757','Bug',NULL,'0afcf4f0-4176-4bf8-94e3-c65ddc1dba17',4),('c667bee6-e25d-46c2-a50e-95ed46fcbd0a','#f2994a','Coding',NULL,'4bf5612f-2676-4d00-a355-10d353815bc5',5),('d9191277-3a87-4293-8e7a-a53f53f75b76','#EB5757','Bug',NULL,'4bf5612f-2676-4d00-a355-10d353815bc5',6),('3cc90964-31b1-4101-8cec-cd7bbb5a5f83','#f7c8c1','Design',NULL,'b0e78907-269d-49a2-9fcd-7c7821f44211',7),('861e6da4-6ba4-407d-96bd-19e52999aa38','#5e6ad2','Database',NULL,'b6017ae2-f716-482c-8419-4e7f90bd3994',8),('c667bee6-e25d-46c2-a50e-95ed46fcbd0a','#f2994a','Coding',NULL,'b6017ae2-f716-482c-8419-4e7f90bd3994',9),('3cc90964-31b1-4101-8cec-cd7bbb5a5f83','#f7c8c1','Design',NULL,'b6017ae2-f716-482c-8419-4e7f90bd3994',10),('1724af9b-b563-4fc7-bf7d-9ae4acdb830f','#5e6ad2','backend',NULL,'b6017ae2-f716-482c-8419-4e7f90bd3994',11),('d9191277-3a87-4293-8e7a-a53f53f75b76','#EB5757','Bug',NULL,'b6017ae2-f716-482c-8419-4e7f90bd3994',12),('45bd09f3-0d43-4350-9ed1-90fc66986b48','#4EA7FC','Improvement',NULL,'b6017ae2-f716-482c-8419-4e7f90bd3994',13),('861e6da4-6ba4-407d-96bd-19e52999aa38','#5e6ad2','Database',NULL,'700f22fe-125f-4a13-9349-2d9138192783',14),('c667bee6-e25d-46c2-a50e-95ed46fcbd0a','#f2994a','Coding',NULL,'700f22fe-125f-4a13-9349-2d9138192783',15),('1724af9b-b563-4fc7-bf7d-9ae4acdb830f','#5e6ad2','backend',NULL,'700f22fe-125f-4a13-9349-2d9138192783',16),('3cc90964-31b1-4101-8cec-cd7bbb5a5f83','#f7c8c1','Design',NULL,'4c880a9f-d026-452c-94d5-3dff950a623d',17),('1724af9b-b563-4fc7-bf7d-9ae4acdb830f','#5e6ad2','backend',NULL,'4c880a9f-d026-452c-94d5-3dff950a623d',18),('753ee75b-2717-4f16-b8ae-bf22befff7cd','#4cb782','frontend',NULL,'4c880a9f-d026-452c-94d5-3dff950a623d',19),('c667bee6-e25d-46c2-a50e-95ed46fcbd0a','#f2994a','Coding',NULL,'0fe95a1d-b58d-4677-bb54-a3079c42bb65',20),('b33649a5-2ae3-47d8-987e-d14e12d513a5','#BB87FC','Feature',NULL,'0fe95a1d-b58d-4677-bb54-a3079c42bb65',21),('d9191277-3a87-4293-8e7a-a53f53f75b76','#EB5757','Bug',NULL,'529bc182-7c78-4516-845e-fdbed41c93e7',22),('b33649a5-2ae3-47d8-987e-d14e12d513a5','#BB87FC','Feature',NULL,'529bc182-7c78-4516-845e-fdbed41c93e7',23),('45bd09f3-0d43-4350-9ed1-90fc66986b48','#4EA7FC','Improvement',NULL,'529bc182-7c78-4516-845e-fdbed41c93e7',24),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'ca8b32ee-82a7-42de-8c17-0e615af40ef3',25),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'c3e1fa35-3d2e-411e-897d-9e5ff80ad01f',26),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'b36d8605-4e66-4aa2-a6ff-14a7b4f395c7',27),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'7c410e92-57e1-41c1-8bdc-71bc35510826',28),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'7a1d3a16-48be-4d4e-8809-f3d8d42a9946',29),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'6c9b337a-9b81-44fb-a29c-7266ca642e16',30),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'657c56b5-35c5-4b75-af75-0b4050d01755',31),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'5e9821ca-1b11-44ac-9a39-6ac671a6ce78',32),('16405279-4b0a-4502-b1c5-04d70b9bff0a','#95a2b3','Intro',NULL,'26a40b4f-f729-43e1-bb0d-1e15629512e3',33);
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
  `updatedAt` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `startDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
INSERT INTO `Project` VALUES ('0155f781-9d6e-4700-a208-544773e02775',NULL,'Project Test 2','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','2024-01-14T07:55:33.330Z','2025-03-06T00:04:22.661Z','','planned',NULL,NULL),('05e34067-6bbe-4a36-a844-14cd53f633cf',NULL,'Team-Test 2 projectt','3db31a46-6209-41cf-be73-1bf8a057f536','2025-03-12T17:00:07.117Z','2025-04-09T21:42:42.443Z','','backlog',NULL,NULL),('231d403b-50ce-462b-83eb-f01a11e321d1',NULL,'test 2025','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','2025-03-05T22:55:35.332Z','2025-05-15T03:22:25.381Z','','started','2025-03-05',NULL),('25717386-03bb-4206-afc0-7dc4f19121bc',NULL,'apple','3db31a46-6209-41cf-be73-1bf8a057f536','2025-04-09T15:26:54.620Z','2025-05-14T21:29:49.035Z','','started','2025-04-09',NULL),('2df3ced1-5166-467d-901c-c55adc8af3d6',NULL,'completed','33982732-a0e4-4df9-af33-fe648d300567','2025-03-06T07:48:22.610Z','2025-03-06T07:48:22.610Z','','completed',NULL,NULL),('42146e7e-2c81-4dc0-a46a-41fe3f3b0c28',NULL,'Team-Test Project 1','7dcefd42-6ac1-496e-9856-89413eb5b4ca','2025-03-07T15:14:59.774Z','2025-03-07T15:14:59.774Z','','backlog',NULL,NULL),('5357aa9c-77fe-4329-91e7-be89b2b53c12',NULL,'Backend','33982732-a0e4-4df9-af33-fe648d300567','2024-01-14T09:21:11.464Z','2025-05-11T10:33:07.155Z','','started','2024-01-14',NULL),('9efd712c-b124-4d84-9b7b-8fcc9287ce1d',NULL,'Project test!','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','2024-01-14T07:43:34.893Z','2025-05-15T00:15:46.196Z','','started','2025-03-05',NULL),('aa5f3aa4-ec57-43e2-a48a-cb38148db8b4',NULL,'Avocado','3db31a46-6209-41cf-be73-1bf8a057f536','2025-03-13T08:40:34.011Z','2025-03-13T08:40:34.011Z','','backlog',NULL,NULL),('c4624a1e-d384-48ab-8248-b2687e098b2c',NULL,'Welcome to Linear','99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','2024-01-14T08:20:58.938Z','2025-05-11T13:12:07.720Z','','started','2024-01-14',NULL),('d3497f91-2231-4ad7-93be-61a8850a3367',NULL,'Frontend','33982732-a0e4-4df9-af33-fe648d300567','2024-01-14T09:20:57.130Z','2025-05-11T13:30:57.284Z','','started','2024-01-14',NULL);
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
  `rate` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Rate_teamId_fkey` (`teamId`),
  CONSTRAINT `Rate_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Rate`
--

LOCK TABLES `Rate` WRITE;
/*!40000 ALTER TABLE `Rate` DISABLE KEYS */;
INSERT INTO `Rate` VALUES (1,'Senior Developer','test-team-1',800.00),(2,'Junior Developer','test-team-1',500.00),(3,'Designer','test-team-1',600.00),(4,'Design','33982732-a0e4-4df9-af33-fe648d300567',2000.00);
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
INSERT INTO `Team` VALUES ('33982732-a0e4-4df9-af33-fe648d300567','Internal tracking tool'),('3db31a46-6209-41cf-be73-1bf8a057f536','Team-Test 2'),('7dcefd42-6ac1-496e-9856-89413eb5b4ca','Team-Test'),('99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da','Enable-made'),('test-team-1','Development Team');
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
  `rateId` int DEFAULT NULL,
  `totalElapsedTime` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Time_userId_fkey` (`userId`),
  KEY `Time_projectId_fkey` (`projectId`),
  KEY `Time_rateId_fkey` (`rateId`),
  CONSTRAINT `Time_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Time_rateId_fkey` FOREIGN KEY (`rateId`) REFERENCES `Rate` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Time_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Time`
--

LOCK TABLES `Time` WRITE;
/*!40000 ALTER TABLE `Time` DISABLE KEYS */;
INSERT INTO `Time` VALUES (1,'2025-07-26 22:00:00.000','2025-08-01 18:38:59.315',2,'2df3ced1-5166-467d-901c-c55adc8af3d6',4,506338367);
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
  `tokenVersion` int NOT NULL DEFAULT '1',
  `hashedRefreshToken` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `idx_user_role` (`role`),
  KEY `idx_user_email_role` (`email`,`role`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'admin@test.com','$2b$10$rOJ1/8U4vvgJE4H6Kj6qg.8dK7V5N2yGM9Qf3L1zX8Kf7mP2wR5vN','ADMIN',1,NULL),(2,'siriussrd@gmail.com','$2b$10$aokhbvl1KSNSMUtxcQhD9Oo5eqnCKQuZkHrQ.M6l80.6YEI8gfhVm','ADMIN',1,'$2b$10$Y2irzxGw9rXiYcvygt23JO3iopDfdPmuRGegy7i.kMG7BXHpZfWp.');
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
  KEY `idx_userteam_userid` (`userId`),
  KEY `idx_userteam_teamid` (`teamId`),
  CONSTRAINT `UserTeam_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `UserTeam_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserTeam`
--

LOCK TABLES `UserTeam` WRITE;
/*!40000 ALTER TABLE `UserTeam` DISABLE KEYS */;
INSERT INTO `UserTeam` VALUES (2,'33982732-a0e4-4df9-af33-fe648d300567'),(2,'3db31a46-6209-41cf-be73-1bf8a057f536'),(2,'7dcefd42-6ac1-496e-9856-89413eb5b4ca'),(2,'99c2fa38-a4f7-4ad7-9fc8-07d44e47b1da'),(2,'test-team-1');
/*!40000 ALTER TABLE `UserTeam` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-01 18:53:56
