
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
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mascota` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `servicio` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `estado` enum('solicitada','confirmada','atendida','rechazada','cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'solicitada',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `horario_activo` tinyint GENERATED ALWAYS AS ((case when (`estado` in (_utf8mb4'solicitada',_utf8mb4'confirmada')) then 1 else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `citas_horario_activo` (`fecha`,`hora`,`horario_activo`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` (`id`, `mascota`, `cliente`, `servicio`, `fecha`, `hora`, `estado`, `created_at`, `updated_at`) VALUES (1,'Max','Ana López','Vacunación','2026-10-28','09:00:00','solicitada','2026-11-10 02:38:11','2026-11-10 02:38:11'),(2,'Voyka','Irvin Chan','Consulta Médica','2026-10-28','13:00:00','solicitada','2026-11-10 02:38:11','2026-11-10 02:38:11'),(3,'Firulais','Agapito Pacheco','Esterilizar','2026-10-28','15:00:00','solicitada','2026-11-10 02:38:11','2026-11-10 02:38:11'),(4,'Rocky','María Gómez','Desparasitar','2026-10-28','12:00:00','solicitada','2026-11-10 02:38:11','2026-11-10 02:38:11'),(5,'Luna','Ana López (demo)','Consulta general','2026-11-10','10:30:00','confirmada','2026-11-09 22:50:08','2026-11-09 22:50:08'),(6,'Max','Ana López (demo)','Consulta general','2026-11-10','11:30:00','confirmada','2026-11-09 22:50:08','2026-11-09 23:09:12'),(7,'Nala','Cliente de prueba U3','Vacunación','2026-11-11','09:30:00','confirmada','2026-11-10 02:47:41','2026-11-10 02:47:41');
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
