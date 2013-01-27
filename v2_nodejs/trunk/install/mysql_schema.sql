-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.5.24-1~dotdeb.1 - (Debian)
-- Server OS:                    debian-linux-gnu
-- HeidiSQL version:             7.0.0.4053
-- Date/time:                    2012-06-10 18:43:18
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET FOREIGN_KEY_CHECKS=0 */;

-- Dumping database structure for jquarry
CREATE DATABASE IF NOT EXISTS `jquarry` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `jquarry`;


-- Dumping structure for table jquarry.database
CREATE TABLE IF NOT EXISTS `database` (
  `name` varchar(255) DEFAULT NULL,
  `drive` varchar(255) DEFAULT NULL,
  `config` varchar(255) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `installation_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- Dumping data for table jquarry.database: ~2 rows (approximately)
/*!40000 ALTER TABLE `database` DISABLE KEYS */;
INSERT INTO `database` (`name`, `drive`, `config`, `id`, `installation_id`) VALUES
	('default', 'default', '{}', 1, 1),
	('default', 'default', '{}', 2, 2);
/*!40000 ALTER TABLE `database` ENABLE KEYS */;


-- Dumping structure for table jquarry.installation
CREATE TABLE IF NOT EXISTS `installation` (
  `name` varchar(255) DEFAULT NULL,
  `root` varchar(255) DEFAULT NULL,
  `config` varchar(255) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- Dumping data for table jquarry.installation: ~2 rows (approximately)
/*!40000 ALTER TABLE `installation` DISABLE KEYS */;
INSERT INTO `installation` (`name`, `root`, `config`, `id`) VALUES
	('Cloud Widgets', 'installation:/84a91f12', '{}', 1),
	('Jack Otis Barker', 'installation:/e7335983', '{}', 2);
/*!40000 ALTER TABLE `installation` ENABLE KEYS */;


-- Dumping structure for table jquarry.user
CREATE TABLE IF NOT EXISTS `user` (
  `name` varchar(255) DEFAULT NULL,
  `quarrypassword` varchar(255) DEFAULT NULL,
  `quarry` varchar(255) DEFAULT NULL,
  `quarrymeta` text,
  `facebook` varchar(255) DEFAULT NULL,
  `facebookmeta` text,
  `twitter` varchar(255) DEFAULT NULL,
  `twittermeta` text,
  `dropbox` text,
  `dropboxmeta` text,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `installation_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

-- Dumping data for table jquarry.user: ~2 rows (approximately)
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` (`name`, `quarrypassword`, `quarry`, `quarrymeta`, `facebook`, `facebookmeta`, `twitter`, `twittermeta`, `dropbox`, `dropboxmeta`, `id`, `installation_id`) VALUES
	('Cloud Widgets', NULL, NULL, NULL, '100003063650070', '{"id":"100003063650070","name":"Cloud Widgets","first_name":"Cloud","last_name":"Widgets","link":"http://www.facebook.com/profile.php?id=100003063650070","gender":"male","timezone":1,"locale":"en_US","verified":true,"updated_time":"2012-05-10T13:34:33+0000"}', NULL, NULL, NULL, NULL, 1, 1),
	('Jack Otis Barker', NULL, NULL, NULL, '222800500', '{"id":"222800500","name":"Jack Otis Barker","first_name":"Jack","middle_name":"Otis","last_name":"Barker","link":"http://www.facebook.com/jackotisbarker","username":"jackotisbarker","hometown":{"id":"108700782494847","name":"Bristol, United Kingdom"},"location":{"id":"106078429431815","name":"London, United Kingdom"},"gender":"male","timezone":1,"locale":"en_US","verified":true,"updated_time":"2012-05-13T20:14:50+0000"}', NULL, NULL, NULL, NULL, 2, 2);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;


-- Dumping structure for table jquarry.website
CREATE TABLE IF NOT EXISTS `website` (
  `name` varchar(255) DEFAULT NULL,
  `drive` varchar(255) DEFAULT NULL,
  `root` varchar(255) DEFAULT NULL,
  `domains` varchar(255) DEFAULT NULL,
  `ftp_username` varchar(255) DEFAULT NULL,
  `ftp_password` varchar(255) DEFAULT NULL,
  `config` text,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `installation_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- Dumping data for table jquarry.website: ~3 rows (approximately)
/*!40000 ALTER TABLE `website` DISABLE KEYS */;
INSERT INTO `website` (`name`, `drive`, `root`, `domains`, `ftp_username`, `ftp_password`, `config`, `id`, `installation_id`) VALUES
	('test', 'test', '2556179d', 'test', '84a91f12/2556179d', 'd0fc0645', '{}', 1, 1),
	('test2', 'test2', '584d3eff', 'test2', '84a91f12/584d3eff', '7a58918c', '{}', 2, 1),
	('site', NULL, 'ecd5ffdf', 'site', 'e7335983/ecd5ffdf', '74ee1e04', '{}', 3, 2);
/*!40000 ALTER TABLE `website` ENABLE KEYS */;
/*!40014 SET FOREIGN_KEY_CHECKS=1 */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
