-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: futurapp
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1da9c81a-c4ce-4bcc-a53e-14e4320eb4a4','cb329b015b39ce30c30e077d619c77ecfd82161ac2ec2c3e5fd70c19b975f705','2026-06-02 21:48:15.264','20260602214815_add_profile_fields',NULL,NULL,'2026-06-02 21:48:15.235',1),('9d44370c-e73e-4a85-9bcb-0a346f1a33de','0a0ffaef18fe0995276aea9071813aa61538cb1abc9f38b41f72147e7dcbf6d7','2026-06-02 21:18:48.124','20260602211700_unique_appointment_service','',NULL,'2026-06-02 21:18:48.124',0),('c1314fff-1115-488f-8507-32307e861ffe','ae951f03a77a62bae0369b3e1ab9171cfc179445d38c0db8525114afb86784d6','2026-06-02 20:32:27.841','20260602203226_init',NULL,NULL,'2026-06-02 20:32:26.821',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areas_especialidad`
--

DROP TABLE IF EXISTS `areas_especialidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `areas_especialidad` (
  `id_area_especialidad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_area_especialidad` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_area_especialidad`),
  UNIQUE KEY `nombre_area` (`nombre_area_especialidad`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas_especialidad`
--

LOCK TABLES `areas_especialidad` WRITE;
/*!40000 ALTER TABLE `areas_especialidad` DISABLE KEYS */;
INSERT INTO `areas_especialidad` VALUES (3,'Hardware'),(5,'PRUEBA_NOTIFICACIONES_Soporte'),(2,'Redes'),(4,'Software'),(1,'Soporte General');
/*!40000 ALTER TABLE `areas_especialidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asesorias`
--

DROP TABLE IF EXISTS `asesorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asesorias` (
  `id_asesoria` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_area_especialidad` int(11) DEFAULT NULL,
  `id_comentario` int(11) DEFAULT NULL,
  `id_notificacion` int(11) DEFAULT NULL,
  `datos_usuario` varchar(50) DEFAULT NULL,
  `tipo_asesoria` varchar(50) DEFAULT NULL,
  `descripcion_problema` varchar(500) DEFAULT NULL,
  `area_especialidad` varchar(50) DEFAULT NULL,
  `comentario` varchar(200) DEFAULT NULL,
  `medio_notificacion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_asesoria`),
  KEY `id_usrs` (`id_usuario`),
  KEY `id_area` (`id_area_especialidad`),
  KEY `id_comentario` (`id_comentario`),
  KEY `id_notificacion` (`id_notificacion`),
  CONSTRAINT `fk_asesorias_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`),
  CONSTRAINT `fk_asesorias_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  CONSTRAINT `fk_asesorias_notificacion` FOREIGN KEY (`id_notificacion`) REFERENCES `notificaciones` (`id_notificacion`),
  CONSTRAINT `fk_asesorias_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asesorias`
--

LOCK TABLES `asesorias` WRITE;
/*!40000 ALTER TABLE `asesorias` DISABLE KEYS */;
/*!40000 ALTER TABLE `asesorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ayudas`
--

DROP TABLE IF EXISTS `ayudas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ayudas` (
  `id_ayuda` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `archivo_url` varchar(255) DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT current_timestamp(),
  `estado` varchar(20) DEFAULT 'Activo',
  PRIMARY KEY (`id_ayuda`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ayudas`
--

LOCK TABLES `ayudas` WRITE;
/*!40000 ALTER TABLE `ayudas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ayudas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `citas` (
  `id_cita` int(11) NOT NULL AUTO_INCREMENT,
  `id_solicitud_servicio` int(11) DEFAULT NULL,
  `id_usuario_cliente` int(11) DEFAULT NULL,
  `id_usuario_tecnico` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `confirmada` tinyint(1) DEFAULT 0,
  `id_estado` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_cita`),
  UNIQUE KEY `uq_citas_id_solicitud_servicio` (`id_solicitud_servicio`),
  KEY `id_solicitud` (`id_solicitud_servicio`),
  KEY `id_usrs` (`id_usuario_cliente`),
  KEY `id_estado` (`id_estado`),
  KEY `idx_citas_id_usuario_cliente` (`id_usuario_cliente`),
  KEY `idx_citas_id_usuario_tecnico` (`id_usuario_tecnico`),
  CONSTRAINT `fk_citas_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`),
  CONSTRAINT `fk_citas_solicitud_servicio` FOREIGN KEY (`id_solicitud_servicio`) REFERENCES `solicitudes_servicio` (`id_solicitud_servicio`),
  CONSTRAINT `fk_citas_usuario_cliente` FOREIGN KEY (`id_usuario_cliente`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `fk_citas_usuario_tecnico` FOREIGN KEY (`id_usuario_tecnico`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` VALUES (1,1,1,NULL,'2025-11-25','10:00:00',1,2),(2,3,1,NULL,'2025-11-26','14:30:00',0,2),(3,2,3,NULL,'2025-11-21','09:00:00',1,4),(4,5,1,NULL,'2025-11-20','16:00:00',1,2),(5,4,5,NULL,'2025-11-28','11:00:00',0,2),(6,8,8,7,'2026-06-10','14:30:00',1,2),(7,9,9,2,'2026-06-04','09:00:00',1,2),(8,10,8,7,'2026-06-11','09:15:00',1,2),(9,11,8,7,NULL,NULL,0,2),(10,12,8,7,'2026-06-05','10:00:00',1,2),(11,13,9,2,NULL,NULL,0,2),(12,14,8,7,'2026-06-15','10:00:00',1,2),(13,15,8,7,'2026-06-15','10:00:00',1,2),(14,16,8,7,'2026-06-16','09:00:00',1,2),(15,17,8,7,'2026-06-20','10:30:00',1,2),(16,18,8,7,'2026-06-20','10:30:00',0,5),(17,19,9,2,NULL,NULL,1,4),(18,20,8,7,NULL,NULL,0,2),(19,21,9,11,NULL,NULL,1,4),(20,22,8,13,NULL,NULL,1,4),(21,23,9,11,NULL,NULL,0,2),(22,24,16,15,NULL,NULL,0,2),(23,25,16,15,NULL,NULL,0,2),(24,28,19,20,NULL,NULL,0,2),(25,29,19,20,NULL,NULL,0,2),(26,30,19,20,NULL,NULL,0,2),(27,31,19,20,NULL,NULL,0,2),(28,32,19,20,'2026-12-20','10:30:00',1,2),(29,34,16,15,NULL,NULL,0,2);
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios`
--

DROP TABLE IF EXISTS `comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comentarios` (
  `id_comentario` int(11) NOT NULL AUTO_INCREMENT,
  `id_cita` int(11) DEFAULT NULL,
  `fecha_comentario` datetime DEFAULT current_timestamp(),
  `id_usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_comentario`),
  KEY `id_cita` (`id_cita`),
  KEY `usrs_fk` (`id_usuario`),
  CONSTRAINT `fk_comentarios_cita` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`),
  CONSTRAINT `fk_comentarios_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
INSERT INTO `comentarios` VALUES (1,3,'2026-04-27 09:32:26',NULL),(2,1,'2026-04-27 09:32:26',NULL),(3,4,'2026-04-27 09:32:26',NULL),(4,2,'2026-04-27 09:32:26',NULL),(5,3,'2026-04-27 09:32:26',NULL);
/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipos`
--

DROP TABLE IF EXISTS `equipos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `equipos` (
  `id_equipo` varchar(25) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `tipo_equipo` varchar(100) DEFAULT NULL,
  `marca_equipo` varchar(100) DEFAULT NULL,
  `modelo_equipo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(50) DEFAULT NULL,
  `sistema_operativo` varchar(100) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `id_estado` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_equipo`),
  UNIQUE KEY `numero_serie` (`numero_serie`),
  KEY `id_usrs` (`id_usuario`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `fk_equipos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`),
  CONSTRAINT `fk_equipos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipos`
--

LOCK TABLES `equipos` WRITE;
/*!40000 ALTER TABLE `equipos` DISABLE KEYS */;
INSERT INTO `equipos` VALUES ('EQ001-A',1,'Portátil','Dell','Inspiron 15','S/N-DELL001','Windows 10','2026-04-27 09:32:26',1),('EQ002-B',1,'PC de Escritorio','HP','ProDesk 400','S/N-HP002','Windows 11','2026-04-27 09:32:26',1),('EQ003-P',3,'Smartphone','Samsung','Galaxy S21','S/N-SAM003','Android 13','2026-04-27 09:32:26',1),('EQ004-M',5,'Tablet','Apple','iPad Air (4ta Gen)','S/N-APL004','iOS 16','2026-04-27 09:32:26',2),('EQ005-A',1,'Impresora','Epson','EcoTank L3150','S/N-EPS005',NULL,'2026-04-27 09:32:26',1);
/*!40000 ALTER TABLE `equipos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estados`
--

DROP TABLE IF EXISTS `estados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estados` (
  `id_estado` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_estado` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `nombre_estado` (`nombre_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estados`
--

LOCK TABLES `estados` WRITE;
/*!40000 ALTER TABLE `estados` DISABLE KEYS */;
INSERT INTO `estados` VALUES (1,'Activo'),(5,'Cancelado'),(3,'En Progreso'),(4,'Finalizado'),(2,'Pendiente');
/*!40000 ALTER TABLE `estados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estados_pago`
--

DROP TABLE IF EXISTS `estados_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estados_pago` (
  `id_estado_pago` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_estado_pago` varchar(30) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_estado_pago`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estados_pago`
--

LOCK TABLES `estados_pago` WRITE;
/*!40000 ALTER TABLE `estados_pago` DISABLE KEYS */;
INSERT INTO `estados_pago` VALUES (1,'Pendiente de Pago','Esperando confirmación de la transacción.'),(2,'Pagado','El pago se ha completado exitosamente.'),(3,'Fallido','La transacción de pago no se pudo completar.'),(4,'Reembolsado','El monto total del pago fue devuelto.'),(5,'En Revisión','El pago está siendo verificado manualmente.');
/*!40000 ALTER TABLE `estados_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medios_pago`
--

DROP TABLE IF EXISTS `medios_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medios_pago` (
  `id_medio_pago` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_medio_pago` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_medio_pago`),
  UNIQUE KEY `nombre_medio` (`nombre_medio_pago`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medios_pago`
--

LOCK TABLES `medios_pago` WRITE;
/*!40000 ALTER TABLE `medios_pago` DISABLE KEYS */;
INSERT INTO `medios_pago` VALUES (8,'Bancolombia'),(5,'Criptomonedas'),(7,'DaviPlata'),(6,'Nequi'),(3,'Pago en Efectivo'),(4,'PayPal'),(9,'Tarjeta'),(1,'Tarjeta de Crédito'),(2,'Transferencia Bancaria');
/*!40000 ALTER TABLE `medios_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_tipo_notificacion` int(11) DEFAULT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `fecha_envio` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacion`),
  KEY `id_usrs` (`id_usuario`),
  KEY `id_tipo_notif` (`id_tipo_notificacion`),
  CONSTRAINT `fk_notificaciones_tipo_notificacion` FOREIGN KEY (`id_tipo_notificacion`) REFERENCES `tipos_notificacion` (`id_tipo_notificacion`),
  CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=257 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,1,1,'Solicitud Recibida','Su solicitud #1 ha sido recibida con éxito.',1,'2026-04-27 09:32:26'),(2,3,2,'Cita Confirmada','Su cita para la solicitud #2 está confirmada.',1,'2026-04-27 09:32:26'),(3,1,4,'Recordatorio de Cita','Tiene una cita mañana a las 10:00 AM.',1,'2026-04-27 09:32:26'),(4,5,1,'Solicitud Recibida','Su solicitud #4 ha sido recibida.',1,'2026-04-27 09:32:26'),(5,1,3,'Pago Registrado','Hemos recibido el pago de su servicio #2.',1,'2026-04-27 09:32:26'),(6,8,1,'Prueba admin fase 3D','Notificacion creada por admin',1,'2026-06-04 04:49:10'),(7,8,1,'Prueba propia fase 3D','Notificacion propia',1,'2026-06-04 04:49:11'),(8,8,1,'Solicitud creada','Tu solicitud #10 fue creada correctamente.',1,'2026-06-04 04:49:11'),(9,8,2,'Cita programada','La cita #8 fue programada para 2026-06-11.',1,'2026-06-04 04:49:11'),(10,7,2,'Cita programada','La cita #8 fue programada para 2026-06-11.',1,'2026-06-04 04:49:11'),(11,8,3,'Pago confirmado','El tecnico confirmo el pago #7.',1,'2026-06-04 04:49:11'),(12,8,1,'Solicitud creada','Tu solicitud #11 fue creada correctamente.',1,'2026-06-04 04:50:33'),(13,7,1,'Servicio asignado','Se te asigno la solicitud #11.',1,'2026-06-04 04:50:33'),(14,8,1,'Tecnico asignado','Tu solicitud #11 ya tiene tecnico asignado.',1,'2026-06-04 04:50:33'),(15,8,1,'Solicitud creada','Tu solicitud #12 fue creada correctamente.',1,'2026-06-04 04:55:29'),(16,7,1,'Servicio asignado','Se te asigno la solicitud #12.',1,'2026-06-04 04:55:29'),(17,8,1,'Tecnico asignado','Tu solicitud #12 ya tiene tecnico asignado.',1,'2026-06-04 04:55:29'),(18,8,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',1,'2026-06-04 04:55:29'),(19,7,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',1,'2026-06-04 04:55:29'),(20,8,3,'Pago registrado','El pago #8 fue marcado como Pagado.',1,'2026-06-04 04:56:35'),(21,7,3,'Pago recibido','Se registro el pago #8 de una cita asignada a ti.',1,'2026-06-04 04:56:35'),(22,8,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',1,'2026-06-04 04:56:35'),(23,7,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',1,'2026-06-04 04:56:35'),(24,8,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',1,'2026-06-04 04:58:02'),(25,7,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',1,'2026-06-04 04:58:02'),(26,9,1,'Solicitud creada','Tu solicitud #13 fue creada correctamente.',1,'2026-06-04 05:00:55'),(27,2,1,'Servicio asignado','Se te asigno la solicitud #13.',1,'2026-06-04 05:01:33'),(28,9,1,'Tecnico asignado','Tu solicitud #13 ya tiene tecnico asignado.',1,'2026-06-04 05:01:33'),(29,8,1,'Solicitud creada','Tu solicitud #14 fue creada correctamente.',1,'2026-06-10 01:46:03'),(30,7,1,'Servicio asignado','Se te asigno la solicitud #14.',1,'2026-06-10 01:46:03'),(31,8,1,'Tecnico asignado','Tu solicitud #14 ya tiene tecnico asignado.',1,'2026-06-10 01:46:03'),(32,8,3,'Pago pendiente','Tu solicitud #14 tiene un pago pendiente por $120.000 COP.',1,'2026-06-10 01:46:03'),(33,7,1,'Servicio asignado','Se te asigno la solicitud #14.',1,'2026-06-10 01:46:03'),(34,8,1,'Tecnico asignado','Tu solicitud #14 ya tiene tecnico asignado.',1,'2026-06-10 01:46:03'),(35,8,3,'Pago pendiente','Tu solicitud #14 tiene un pago pendiente por $121.000 COP.',1,'2026-06-10 01:46:03'),(36,8,2,'Cita programada','La cita #12 fue programada para 2026-06-15.',1,'2026-06-10 01:46:03'),(37,7,2,'Cita programada','La cita #12 fue programada para 2026-06-15.',1,'2026-06-10 01:46:03'),(38,8,3,'Pago registrado','El pago #9 fue marcado como Pagado.',1,'2026-06-10 01:46:04'),(39,7,3,'Pago recibido','Se registro el pago #9 de una cita asignada a ti.',1,'2026-06-10 01:46:04'),(40,8,3,'Pago confirmado','El tecnico confirmo el pago #9.',1,'2026-06-10 01:46:04'),(41,8,1,'Solicitud creada','Tu solicitud #15 fue creada correctamente.',1,'2026-06-10 01:46:04'),(42,7,1,'Servicio asignado','Se te asigno la solicitud #15.',1,'2026-06-10 01:46:04'),(43,8,1,'Tecnico asignado','Tu solicitud #15 ya tiene tecnico asignado.',1,'2026-06-10 01:46:04'),(44,8,3,'Pago pendiente','Tu solicitud #15 tiene un pago pendiente por $130.000 COP.',1,'2026-06-10 01:46:04'),(45,7,1,'Servicio asignado','Se te asigno la solicitud #15.',1,'2026-06-10 01:46:04'),(46,8,1,'Tecnico asignado','Tu solicitud #15 ya tiene tecnico asignado.',1,'2026-06-10 01:46:04'),(47,8,3,'Pago pendiente','Tu solicitud #15 tiene un pago pendiente por $131.000 COP.',1,'2026-06-10 01:46:04'),(48,8,2,'Cita programada','La cita #13 fue programada para 2026-06-15.',1,'2026-06-10 01:46:04'),(49,7,2,'Cita programada','La cita #13 fue programada para 2026-06-15.',1,'2026-06-10 01:46:04'),(50,8,3,'Pago registrado','El pago #10 fue marcado como Pagado.',1,'2026-06-10 01:46:04'),(51,7,3,'Pago recibido','Se registro el pago #10 de una cita asignada a ti.',1,'2026-06-10 01:46:04'),(52,8,3,'Pago confirmado con observacion','El tecnico confirmo el pago #10 con diferencia de metodo.',1,'2026-06-10 01:46:04'),(53,4,3,'Revision de pago requerida','El pago #10 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',1,'2026-06-10 01:46:04'),(54,6,3,'Revision de pago requerida','El pago #10 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',1,'2026-06-10 01:46:05'),(55,10,3,'Revision de pago requerida','El pago #10 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',1,'2026-06-10 01:46:05'),(56,8,1,'Solicitud creada','Tu solicitud #16 fue creada correctamente.',1,'2026-06-10 01:46:40'),(57,7,1,'Servicio asignado','Se te asigno la solicitud #16.',1,'2026-06-10 01:46:40'),(58,8,1,'Tecnico asignado','Tu solicitud #16 ya tiene tecnico asignado.',1,'2026-06-10 01:46:40'),(59,8,3,'Pago pendiente','Tu solicitud #16 tiene un pago pendiente por $140.000 COP.',1,'2026-06-10 01:46:41'),(60,8,2,'Cita programada','La cita #14 fue programada para 2026-06-16.',1,'2026-06-10 01:46:41'),(61,7,2,'Cita programada','La cita #14 fue programada para 2026-06-16.',1,'2026-06-10 01:46:41'),(62,8,3,'Pago registrado','El pago #11 fue marcado como Pagado.',1,'2026-06-10 01:46:41'),(63,7,3,'Pago recibido','Se registro el pago #11 de una cita asignada a ti.',1,'2026-06-10 01:46:41'),(64,8,3,'Pago confirmado','El tecnico confirmo el pago #11.',1,'2026-06-10 01:46:41'),(65,8,1,'Solicitud creada','Tu solicitud #17 fue creada correctamente.',1,'2026-06-10 01:59:05'),(66,7,1,'Servicio asignado','Se te asigno la solicitud #17.',1,'2026-06-10 01:59:05'),(67,8,1,'Tecnico asignado','Tu solicitud #17 ya tiene tecnico asignado.',1,'2026-06-10 01:59:05'),(68,8,3,'Pago pendiente','Tu solicitud #17 tiene un pago pendiente por $150.000 COP.',1,'2026-06-10 01:59:05'),(69,7,1,'Servicio asignado','Se te asigno la solicitud #17.',1,'2026-06-10 01:59:05'),(70,8,1,'Tecnico asignado','Tu solicitud #17 ya tiene tecnico asignado.',1,'2026-06-10 01:59:05'),(71,8,3,'Pago pendiente','Tu solicitud #17 tiene un pago pendiente por $151.000 COP.',1,'2026-06-10 01:59:05'),(72,8,2,'Cita programada','La cita #15 fue programada para 2026-06-20.',1,'2026-06-10 01:59:05'),(73,7,2,'Cita programada','La cita #15 fue programada para 2026-06-20.',1,'2026-06-10 01:59:05'),(74,8,3,'Pago registrado','El pago #12 fue marcado como Pagado.',1,'2026-06-10 01:59:05'),(75,7,3,'Pago recibido','Se registro el pago #12 de una cita asignada a ti.',1,'2026-06-10 01:59:05'),(76,8,3,'Pago confirmado','El tecnico confirmo el pago #12.',1,'2026-06-10 01:59:05'),(77,8,1,'Solicitud creada','Tu solicitud #18 fue creada correctamente.',1,'2026-06-10 01:59:05'),(78,7,1,'Servicio asignado','Se te asigno la solicitud #18.',1,'2026-06-10 01:59:05'),(79,8,1,'Tecnico asignado','Tu solicitud #18 ya tiene tecnico asignado.',1,'2026-06-10 01:59:05'),(80,8,3,'Pago pendiente','Tu solicitud #18 tiene un pago pendiente por $160.000 COP.',1,'2026-06-10 01:59:05'),(81,7,1,'Servicio asignado','Se te asigno la solicitud #18.',1,'2026-06-10 01:59:06'),(82,8,1,'Tecnico asignado','Tu solicitud #18 ya tiene tecnico asignado.',1,'2026-06-10 01:59:06'),(83,8,3,'Pago pendiente','Tu solicitud #18 tiene un pago pendiente por $161.000 COP.',1,'2026-06-10 01:59:06'),(84,8,2,'Cita programada','La cita #16 fue programada para 2026-06-20.',1,'2026-06-10 01:59:06'),(85,7,2,'Cita programada','La cita #16 fue programada para 2026-06-20.',1,'2026-06-10 01:59:06'),(86,8,3,'Pago registrado','El pago #13 fue marcado como Pagado.',1,'2026-06-10 01:59:06'),(87,7,3,'Pago recibido','Se registro el pago #13 de una cita asignada a ti.',1,'2026-06-10 01:59:06'),(88,8,3,'Pago confirmado con observacion','El tecnico confirmo el pago #13 con diferencia de metodo.',1,'2026-06-10 01:59:06'),(89,4,3,'Revision de pago requerida','El pago #13 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',1,'2026-06-10 01:59:06'),(90,6,3,'Revision de pago requerida','El pago #13 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',1,'2026-06-10 01:59:06'),(91,10,3,'Revision de pago requerida','El pago #13 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',1,'2026-06-10 01:59:06'),(92,9,1,'Solicitud creada','Tu solicitud #19 fue creada correctamente.',1,'2026-06-10 02:12:38'),(93,2,1,'Servicio asignado','Se te asigno la solicitud #19.',1,'2026-06-10 02:13:26'),(94,9,1,'Tecnico asignado','Tu solicitud #19 ya tiene tecnico asignado.',1,'2026-06-10 02:13:26'),(95,9,3,'Pago pendiente','Tu solicitud #19 tiene un pago pendiente por $80.000 COP.',1,'2026-06-10 02:13:26'),(96,9,3,'Pago registrado','El pago #14 fue marcado como Pagado.',1,'2026-06-10 02:17:55'),(97,2,3,'Pago recibido','Se registro el pago #14 de una cita asignada a ti.',1,'2026-06-10 02:17:55'),(98,8,1,'Solicitud creada','Tu solicitud #20 fue creada correctamente.',1,'2026-06-10 02:38:25'),(99,2,1,'Servicio asignado','Se te asigno la solicitud #20.',1,'2026-06-10 02:38:26'),(100,8,1,'Tecnico asignado','Tu solicitud #20 ya tiene tecnico asignado.',1,'2026-06-10 02:38:26'),(101,8,3,'Pago pendiente','Tu solicitud #20 tiene un pago pendiente por $85.000 COP.',1,'2026-06-10 02:38:26'),(102,7,1,'Servicio asignado','Se te asigno la solicitud #20.',1,'2026-06-10 02:38:26'),(103,8,1,'Tecnico asignado','Tu solicitud #20 ya tiene tecnico asignado.',1,'2026-06-10 02:38:26'),(104,8,3,'Pago pendiente','Tu solicitud #20 tiene un pago pendiente por $90.000 COP.',1,'2026-06-10 02:38:26'),(105,7,1,'Servicio asignado','Se te asigno la solicitud #20.',1,'2026-06-10 02:38:26'),(106,8,1,'Tecnico asignado','Tu solicitud #20 ya tiene tecnico asignado.',1,'2026-06-10 02:38:26'),(107,8,3,'Pago pendiente','Tu solicitud #20 tiene un pago pendiente por $100.000 COP.',1,'2026-06-10 02:38:26'),(108,8,3,'Pago registrado','El pago #15 fue marcado como Pagado.',1,'2026-06-10 02:39:02'),(109,7,3,'Pago recibido','Se registro el pago #15 de una cita asignada a ti.',1,'2026-06-10 02:39:02'),(110,9,1,'Solicitud creada','Tu solicitud #21 fue creada correctamente.',1,'2026-06-10 02:44:23'),(111,11,1,'Servicio asignado','Se te asigno la solicitud #21.',1,'2026-06-10 02:45:13'),(112,9,1,'Tecnico asignado','Tu solicitud #21 ya tiene tecnico asignado.',1,'2026-06-10 02:45:13'),(113,9,3,'Pago pendiente','Tu solicitud #21 tiene un pago pendiente por $100.000 COP.',1,'2026-06-10 02:45:13'),(114,9,3,'Pago registrado','El pago #16 fue marcado como Pagado.',1,'2026-06-10 02:46:55'),(115,11,3,'Pago recibido','Se registro el pago #16 de una cita asignada a ti.',1,'2026-06-10 02:46:56'),(116,9,3,'Pago confirmado','El tecnico confirmo el pago #16.',1,'2026-06-10 02:47:29'),(117,8,1,'Solicitud creada','Tu solicitud #22 fue creada correctamente.',1,'2026-06-10 03:04:33'),(118,13,1,'Servicio asignado','Se te asigno la solicitud #22.',1,'2026-06-10 03:04:33'),(119,8,1,'Tecnico asignado','Tu solicitud #22 ya tiene tecnico asignado.',1,'2026-06-10 03:04:33'),(120,8,2,'Estado de cita actualizado','La cita #20 cambio a Cancelada.',1,'2026-06-10 03:05:18'),(121,13,2,'Estado de cita actualizado','La cita #20 cambio a Cancelada.',1,'2026-06-10 03:05:18'),(122,8,2,'Estado de cita actualizado','La cita #20 cambio a Completada.',1,'2026-06-10 03:09:50'),(123,13,2,'Estado de cita actualizado','La cita #20 cambio a Completada.',1,'2026-06-10 03:09:50'),(124,9,2,'Estado de cita actualizado','La cita #19 cambio a Completada.',1,'2026-06-10 03:09:52'),(125,11,2,'Estado de cita actualizado','La cita #19 cambio a Completada.',1,'2026-06-10 03:09:52'),(126,9,2,'Estado de cita actualizado','La cita #17 cambio a Completada.',1,'2026-06-10 03:09:56'),(127,2,2,'Estado de cita actualizado','La cita #17 cambio a Completada.',1,'2026-06-10 03:09:56'),(128,9,1,'Solicitud creada','Tu solicitud #23 fue creada correctamente.',1,'2026-06-10 03:36:29'),(129,11,1,'Servicio asignado','Se te asigno la solicitud #23.',1,'2026-06-10 03:37:47'),(130,9,1,'Tecnico asignado','Tu solicitud #23 ya tiene tecnico asignado.',1,'2026-06-10 03:37:47'),(131,9,3,'Pago pendiente','Tu solicitud #23 tiene un pago pendiente por $90.000 COP.',1,'2026-06-10 03:37:48'),(132,9,3,'Pago registrado','El pago #17 fue marcado como Pagado.',1,'2026-06-10 03:38:56'),(133,11,3,'Pago recibido','Se registro el pago #17 de una cita asignada a ti.',1,'2026-06-10 03:38:56'),(134,9,3,'Pago confirmado','El tecnico confirmo el pago #17.',1,'2026-06-10 03:39:28'),(135,16,1,'Solicitud creada','Tu solicitud #24 fue creada correctamente.',0,'2026-06-11 13:15:03'),(136,15,1,'Servicio asignado','Se te asigno la solicitud #24.',0,'2026-06-11 13:16:33'),(137,16,1,'Tecnico asignado','Tu solicitud #24 ya tiene tecnico asignado.',0,'2026-06-11 13:16:33'),(138,16,3,'Pago pendiente','Tu solicitud #24 tiene un pago pendiente por $80.000 COP.',0,'2026-06-11 13:16:33'),(139,16,3,'Pago registrado','El pago #18 fue marcado como Pagado.',0,'2026-06-11 13:18:09'),(140,15,3,'Pago recibido','Se registro el pago #18 de una cita asignada a ti.',0,'2026-06-11 13:18:09'),(141,16,3,'Pago confirmado','El tecnico confirmo el pago #18.',0,'2026-06-11 13:18:34'),(142,8,2,'Estado de cita actualizado','La cita #16 cambio a Cancelada.',0,'2026-06-16 00:53:05'),(143,7,2,'Estado de cita actualizado','La cita #16 cambio a Cancelada.',0,'2026-06-16 00:53:05'),(144,16,1,'Solicitud creada','Tu solicitud #25 fue creada correctamente.',0,'2026-06-16 02:04:23'),(145,15,1,'Servicio asignado','Se te asigno la solicitud #25.',0,'2026-06-16 02:06:22'),(146,16,1,'Tecnico asignado','Tu solicitud #25 ya tiene tecnico asignado.',0,'2026-06-16 02:06:22'),(147,16,3,'Pago pendiente','Tu solicitud #25 tiene un pago pendiente por $50.000 COP.',0,'2026-06-16 02:06:22'),(148,19,1,'Solicitud creada','Tu solicitud #26 fue creada correctamente.',0,'2026-06-16 02:31:48'),(149,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #26.',0,'2026-06-16 02:31:48'),(150,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #26.',1,'2026-06-16 02:31:48'),(151,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #26.',0,'2026-06-16 02:31:48'),(152,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #26.',1,'2026-06-16 02:31:48'),(153,19,1,'Solicitud creada','Tu solicitud #27 fue creada correctamente.',0,'2026-06-16 02:31:48'),(154,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #27.',0,'2026-06-16 02:31:48'),(155,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #27.',1,'2026-06-16 02:31:48'),(156,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #27.',0,'2026-06-16 02:31:48'),(157,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #27.',1,'2026-06-16 02:31:48'),(158,10,1,'Solicitud cancelada','El usuario PRUEBA_NOTIFICACIONES Usuario cancelo la solicitud #27.',0,'2026-06-16 02:31:48'),(159,14,1,'Solicitud cancelada','El usuario PRUEBA_NOTIFICACIONES Usuario cancelo la solicitud #27.',1,'2026-06-16 02:31:48'),(160,17,1,'Solicitud cancelada','El usuario PRUEBA_NOTIFICACIONES Usuario cancelo la solicitud #27.',0,'2026-06-16 02:31:48'),(161,18,1,'Solicitud cancelada','El usuario PRUEBA_NOTIFICACIONES Usuario cancelo la solicitud #27.',1,'2026-06-16 02:31:48'),(162,19,1,'Solicitud creada','Tu solicitud #28 fue creada correctamente.',0,'2026-06-16 02:31:48'),(163,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #28.',0,'2026-06-16 02:31:48'),(164,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #28.',1,'2026-06-16 02:31:48'),(165,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #28.',0,'2026-06-16 02:31:48'),(166,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #28.',1,'2026-06-16 02:31:48'),(167,20,1,'Servicio asignado','Se te asigno la solicitud #28.',0,'2026-06-16 02:31:48'),(168,19,1,'Tecnico asignado','Tu solicitud #28 ya tiene tecnico asignado.',0,'2026-06-16 02:31:48'),(169,19,3,'Pago pendiente','Tu solicitud #28 tiene un pago pendiente por $25.000 COP.',0,'2026-06-16 02:31:48'),(170,19,3,'Pago registrado','El pago #20 fue marcado como Pagado.',0,'2026-06-16 02:31:48'),(171,20,3,'Pago recibido','Se registro el pago #20 de una cita asignada a ti.',0,'2026-06-16 02:31:48'),(172,10,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #20 por $25.000 COP mediante DaviPlata.',0,'2026-06-16 02:31:48'),(173,14,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #20 por $25.000 COP mediante DaviPlata.',1,'2026-06-16 02:31:48'),(174,17,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #20 por $25.000 COP mediante DaviPlata.',0,'2026-06-16 02:31:48'),(175,18,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #20 por $25.000 COP mediante DaviPlata.',1,'2026-06-16 02:31:48'),(176,19,1,'Solicitud creada','Tu solicitud #29 fue creada correctamente.',0,'2026-06-16 02:31:48'),(177,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #29.',0,'2026-06-16 02:31:48'),(178,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #29.',1,'2026-06-16 02:31:48'),(179,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #29.',0,'2026-06-16 02:31:48'),(180,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #29.',1,'2026-06-16 02:31:48'),(181,20,1,'Servicio asignado','Se te asigno la solicitud #29.',0,'2026-06-16 02:31:48'),(182,19,1,'Tecnico asignado','Tu solicitud #29 ya tiene tecnico asignado.',0,'2026-06-16 02:31:48'),(183,19,3,'Pago pendiente','Tu solicitud #29 tiene un pago pendiente por $30.000 COP.',0,'2026-06-16 02:31:48'),(184,19,3,'Pago registrado','El pago #21 fue marcado como Pagado.',0,'2026-06-16 02:31:48'),(185,20,3,'Pago recibido','Se registro el pago #21 de una cita asignada a ti.',0,'2026-06-16 02:31:48'),(186,10,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #21 por $30.000 COP mediante DaviPlata.',0,'2026-06-16 02:31:48'),(187,14,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #21 por $30.000 COP mediante DaviPlata.',1,'2026-06-16 02:31:48'),(188,17,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #21 por $30.000 COP mediante DaviPlata.',0,'2026-06-16 02:31:48'),(189,18,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #21 por $30.000 COP mediante DaviPlata.',1,'2026-06-16 02:31:48'),(190,19,3,'Pago confirmado','El tecnico confirmo el pago #21.',0,'2026-06-16 02:31:48'),(191,19,1,'Solicitud creada','Tu solicitud #30 fue creada correctamente.',0,'2026-06-16 02:31:48'),(192,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #30.',0,'2026-06-16 02:31:48'),(193,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #30.',1,'2026-06-16 02:31:48'),(194,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #30.',0,'2026-06-16 02:31:48'),(195,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #30.',1,'2026-06-16 02:31:48'),(196,20,1,'Servicio asignado','Se te asigno la solicitud #30.',0,'2026-06-16 02:31:49'),(197,19,1,'Tecnico asignado','Tu solicitud #30 ya tiene tecnico asignado.',0,'2026-06-16 02:31:49'),(198,19,3,'Pago pendiente','Tu solicitud #30 tiene un pago pendiente por $30.000 COP.',0,'2026-06-16 02:31:49'),(199,19,3,'Pago registrado','El pago #22 fue marcado como Pagado.',0,'2026-06-16 02:31:49'),(200,20,3,'Pago recibido','Se registro el pago #22 de una cita asignada a ti.',0,'2026-06-16 02:31:49'),(201,10,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #22 por $30.000 COP mediante DaviPlata.',0,'2026-06-16 02:31:49'),(202,14,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #22 por $30.000 COP mediante DaviPlata.',1,'2026-06-16 02:31:49'),(203,17,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #22 por $30.000 COP mediante DaviPlata.',0,'2026-06-16 02:31:49'),(204,18,3,'Pago realizado','El usuario PRUEBA_NOTIFICACIONES Usuario realizo el pago #22 por $30.000 COP mediante DaviPlata.',1,'2026-06-16 02:31:49'),(205,19,3,'Pago confirmado con observacion','El tecnico confirmo el pago #22 con diferencia de metodo.',0,'2026-06-16 02:31:49'),(206,10,3,'Revision de pago requerida','En el pago #22, el usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo. El proceso continuo con observacion.',0,'2026-06-16 02:31:49'),(207,14,3,'Revision de pago requerida','En el pago #22, el usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo. El proceso continuo con observacion.',1,'2026-06-16 02:31:49'),(208,17,3,'Revision de pago requerida','En el pago #22, el usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo. El proceso continuo con observacion.',0,'2026-06-16 02:31:49'),(209,18,3,'Revision de pago requerida','En el pago #22, el usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo. El proceso continuo con observacion.',1,'2026-06-16 02:31:49'),(210,19,1,'Solicitud creada','Tu solicitud #31 fue creada correctamente.',0,'2026-06-16 02:31:49'),(211,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #31.',0,'2026-06-16 02:31:49'),(212,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #31.',1,'2026-06-16 02:31:49'),(213,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #31.',0,'2026-06-16 02:31:49'),(214,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #31.',1,'2026-06-16 02:31:49'),(215,20,1,'Servicio asignado','Se te asigno la solicitud #31.',0,'2026-06-16 02:31:49'),(216,19,1,'Tecnico asignado','Tu solicitud #31 ya tiene tecnico asignado.',0,'2026-06-16 02:31:49'),(217,19,1,'Solicitud creada','Tu solicitud #32 fue creada correctamente.',0,'2026-06-16 02:31:49'),(218,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #32.',0,'2026-06-16 02:31:49'),(219,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #32.',1,'2026-06-16 02:31:49'),(220,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #32.',0,'2026-06-16 02:31:49'),(221,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #32.',1,'2026-06-16 02:31:49'),(222,20,1,'Servicio asignado','Se te asigno la solicitud #32.',0,'2026-06-16 02:31:49'),(223,19,1,'Tecnico asignado','Tu solicitud #32 ya tiene tecnico asignado.',0,'2026-06-16 02:31:49'),(224,19,3,'Pago pendiente','Tu solicitud #32 tiene un pago pendiente por $35.000 COP.',0,'2026-06-16 02:31:49'),(225,19,2,'Cita programada','La cita #28 fue programada para 2026-12-20.',0,'2026-06-16 02:31:49'),(226,20,2,'Cita programada','La cita #28 fue programada para 2026-12-20.',0,'2026-06-16 02:31:49'),(227,19,3,'Pago pendiente actualizado','La cita #28 tiene un pago pendiente por $35.000 COP.',0,'2026-06-16 02:31:49'),(228,17,1,'PRUEBA_NOTIFICACIONES_N01 adminA','PRUEBA_NOTIFICACIONES_N01 notificacion personal adminA 1781577109404',0,'2026-06-16 02:31:49'),(229,18,1,'PRUEBA_NOTIFICACIONES_N01 adminB','PRUEBA_NOTIFICACIONES_N01 notificacion personal adminB 1781577109417',1,'2026-06-16 02:31:49'),(230,19,1,'PRUEBA_NOTIFICACIONES_N01 usuario','PRUEBA_NOTIFICACIONES_N01 notificacion personal usuario 1781577109429',0,'2026-06-16 02:31:49'),(231,20,1,'PRUEBA_NOTIFICACIONES_N01 tecnico','PRUEBA_NOTIFICACIONES_N01 notificacion personal tecnico 1781577109443',0,'2026-06-16 02:31:49'),(232,19,1,'PRUEBA_NOTIFICACIONES_N05 usuario','PRUEBA_NOTIFICACIONES_N05 creada por admin para usuario 1781577109515',0,'2026-06-16 02:31:49'),(233,19,1,'Solicitud creada','Tu solicitud #33 fue creada correctamente.',0,'2026-06-16 02:31:49'),(234,10,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #33.',0,'2026-06-16 02:31:49'),(235,14,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #33.',1,'2026-06-16 02:31:49'),(236,17,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #33.',0,'2026-06-16 02:31:49'),(237,18,1,'Nueva solicitud de servicio','El usuario PRUEBA_NOTIFICACIONES Usuario creo la solicitud #33.',0,'2026-06-16 02:31:49'),(238,16,1,'Solicitud creada','Tu solicitud #34 fue creada correctamente.',0,'2026-06-16 02:42:03'),(239,10,1,'Nueva solicitud de servicio','El usuario Angelina Redondo creo la solicitud #34.',0,'2026-06-16 02:42:03'),(240,14,1,'Nueva solicitud de servicio','El usuario Angelina Redondo creo la solicitud #34.',1,'2026-06-16 02:42:03'),(241,17,1,'Nueva solicitud de servicio','El usuario Angelina Redondo creo la solicitud #34.',0,'2026-06-16 02:42:03'),(242,18,1,'Nueva solicitud de servicio','El usuario Angelina Redondo creo la solicitud #34.',0,'2026-06-16 02:42:03'),(243,10,1,'Solicitud cancelada','El usuario Angelina Redondo cancelo la solicitud #25.',0,'2026-06-16 02:42:06'),(244,14,1,'Solicitud cancelada','El usuario Angelina Redondo cancelo la solicitud #25.',1,'2026-06-16 02:42:06'),(245,17,1,'Solicitud cancelada','El usuario Angelina Redondo cancelo la solicitud #25.',0,'2026-06-16 02:42:06'),(246,18,1,'Solicitud cancelada','El usuario Angelina Redondo cancelo la solicitud #25.',0,'2026-06-16 02:42:06'),(247,15,1,'Servicio asignado','Se te asigno la solicitud #34.',0,'2026-06-16 02:43:45'),(248,16,1,'Tecnico asignado','Tu solicitud #34 ya tiene tecnico asignado.',0,'2026-06-16 02:43:45'),(249,16,3,'Pago pendiente','Tu solicitud #34 tiene un pago pendiente por $60.000 COP.',0,'2026-06-16 02:43:45'),(250,16,3,'Pago registrado','El pago #24 fue marcado como Pagado.',0,'2026-06-16 02:44:49'),(251,15,3,'Pago recibido','Se registro el pago #24 de una cita asignada a ti.',0,'2026-06-16 02:44:49'),(252,10,3,'Pago realizado','El usuario Angelina Redondo realizo el pago #24 por $60.000 COP mediante DaviPlata.',0,'2026-06-16 02:44:49'),(253,14,3,'Pago realizado','El usuario Angelina Redondo realizo el pago #24 por $60.000 COP mediante DaviPlata.',1,'2026-06-16 02:44:49'),(254,17,3,'Pago realizado','El usuario Angelina Redondo realizo el pago #24 por $60.000 COP mediante DaviPlata.',0,'2026-06-16 02:44:49'),(255,18,3,'Pago realizado','El usuario Angelina Redondo realizo el pago #24 por $60.000 COP mediante DaviPlata.',0,'2026-06-16 02:44:49'),(256,16,3,'Pago confirmado','El tecnico confirmo el pago #24.',0,'2026-06-16 02:45:06');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL AUTO_INCREMENT,
  `id_cita` int(11) DEFAULT NULL,
  `id_medio_pago` int(11) DEFAULT NULL,
  `id_estado_pago` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `fecha_pago` datetime DEFAULT current_timestamp(),
  `detalle_comprobante` text DEFAULT NULL,
  PRIMARY KEY (`id_pago`),
  KEY `id_cita` (`id_cita`),
  KEY `id_medio` (`id_medio_pago`),
  KEY `id_estado_pago` (`id_estado_pago`),
  KEY `id_usrs` (`id_usuario`),
  CONSTRAINT `fk_pagos_cita` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`),
  CONSTRAINT `fk_pagos_estado_pago` FOREIGN KEY (`id_estado_pago`) REFERENCES `estados_pago` (`id_estado_pago`),
  CONSTRAINT `fk_pagos_medio_pago` FOREIGN KEY (`id_medio_pago`) REFERENCES `medios_pago` (`id_medio_pago`),
  CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,3,1,2,3,120.00,'2026-04-27 09:32:26','Ref: TRJ-00123456'),(2,3,2,2,3,75.00,'2026-04-27 09:32:26','Ref: BAN-98765432'),(3,1,3,1,1,45.00,'2026-04-27 09:32:26','Pendiente efectivo a la llegada'),(4,5,1,3,5,30.00,'2026-04-27 09:32:26','Pago fallido con tarjeta'),(5,2,2,4,1,75.00,'2026-04-27 09:32:26','Reembolso por cancelación de servicio'),(6,6,3,2,8,100.00,'2026-06-04 04:33:22','Pago usuario fase 3C'),(7,6,2,2,8,200.00,'2026-06-04 04:49:11','Evento pago notificacion fase 3D'),(8,10,6,2,8,90000.00,'2026-06-04 04:56:35','Pago simulado: 2026-06-04T04:56:35.113Z'),(9,12,7,2,8,121000.00,'2026-06-10 01:46:04','Pago simulado: 2026-06-10T01:46:04.006Z'),(10,13,7,2,8,131000.00,'2026-06-10 01:46:04','Pago simulado: 2026-06-10T01:46:04.707Z'),(11,14,7,2,8,140000.00,'2026-06-10 01:46:41','Pago simulado: 2026-06-10T01:46:41.119Z'),(12,15,7,2,8,151000.00,'2026-06-10 01:59:05','Pago simulado: 2026-06-10T01:59:05.723Z'),(13,16,7,2,8,161000.00,'2026-06-10 01:59:06','Pago simulado: 2026-06-10T01:59:06.133Z'),(14,17,6,2,9,80000.00,'2026-06-10 02:17:55','Pago simulado: 2026-06-10T02:17:55.149Z'),(15,18,7,2,8,100000.00,'2026-06-10 02:39:02','Pago simulado: 2026-06-10T02:39:02.543Z'),(16,19,7,2,9,100000.00,'2026-06-10 02:46:55','Pago simulado: 2026-06-10T02:46:55.122Z'),(17,21,6,2,9,90000.00,'2026-06-10 03:38:56','Pago simulado: 2026-06-10T03:38:56.326Z'),(18,22,6,2,16,80000.00,'2026-06-11 13:18:09','Pago simulado: 2026-06-11T13:18:09.176Z'),(19,23,NULL,1,16,50000.00,NULL,NULL),(20,24,7,2,19,25000.00,'2026-06-16 02:31:48','PRUEBA_NOTIFICACIONES_U03_1781577108618'),(21,25,7,2,19,30000.00,'2026-06-16 02:31:48','PRUEBA_NOTIFICACIONES_T01_1781577108825'),(22,26,7,2,19,30000.00,'2026-06-16 02:31:49','PRUEBA_NOTIFICACIONES_T02_T03_1781577109028'),(23,28,NULL,1,19,35000.00,NULL,NULL),(24,29,7,2,16,60000.00,'2026-06-16 02:44:49','Pago simulado: 2026-06-16T02:44:49.851Z');
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prioridades`
--

DROP TABLE IF EXISTS `prioridades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prioridades` (
  `id_prioridad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_prioridad` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_prioridad`),
  UNIQUE KEY `nombre_prioridad` (`nombre_prioridad`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prioridades`
--

LOCK TABLES `prioridades` WRITE;
/*!40000 ALTER TABLE `prioridades` DISABLE KEYS */;
INSERT INTO `prioridades` VALUES (3,'Alta'),(1,'Baja'),(5,'Crítica'),(2,'Media'),(4,'Urgente');
/*!40000 ALTER TABLE `prioridades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes`
--

DROP TABLE IF EXISTS `reportes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reportes` (
  `id_reporte` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `tipo_reporte` varchar(50) DEFAULT NULL,
  `fecha_generacion` datetime DEFAULT current_timestamp(),
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `formato` varchar(20) DEFAULT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'Generado',
  PRIMARY KEY (`id_reporte`),
  KEY `fk_reporte_usuario` (`id_usuario`),
  CONSTRAINT `fk_reportes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes`
--

LOCK TABLES `reportes` WRITE;
/*!40000 ALTER TABLE `reportes` DISABLE KEYS */;
/*!40000 ALTER TABLE `reportes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resenas`
--

DROP TABLE IF EXISTS `resenas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resenas` (
  `id_resena` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_asesoria` int(11) DEFAULT NULL,
  `id_solicitud_servicio` int(11) DEFAULT NULL,
  `calificacion` int(1) DEFAULT NULL,
  `comentario` varchar(500) DEFAULT NULL,
  `respuesta_tecnico` varchar(500) DEFAULT NULL,
  `fecha_resena` datetime DEFAULT current_timestamp(),
  `estado` varchar(20) DEFAULT 'Activa',
  PRIMARY KEY (`id_resena`),
  KEY `fk_resena_usuario` (`id_usuario`),
  KEY `fk_resena_asesoria` (`id_asesoria`),
  KEY `fk_resena_solicitud` (`id_solicitud_servicio`),
  CONSTRAINT `fk_resenas_asesoria` FOREIGN KEY (`id_asesoria`) REFERENCES `asesorias` (`id_asesoria`),
  CONSTRAINT `fk_resenas_solicitud_servicio` FOREIGN KEY (`id_solicitud_servicio`) REFERENCES `solicitudes_servicio` (`id_solicitud_servicio`),
  CONSTRAINT `fk_resenas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resenas`
--

LOCK TABLES `resenas` WRITE;
/*!40000 ALTER TABLE `resenas` DISABLE KEYS */;
/*!40000 ALTER TABLE `resenas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `respuestas_comentarios`
--

DROP TABLE IF EXISTS `respuestas_comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `respuestas_comentarios` (
  `id_respuesta` int(11) NOT NULL AUTO_INCREMENT,
  `id_comentario` int(11) DEFAULT NULL,
  `id_usuario_respondedor` int(11) DEFAULT NULL,
  `texto_respuesta` text DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_respuesta`),
  KEY `id_comentario` (`id_comentario`),
  KEY `id_respondedor` (`id_usuario_respondedor`),
  CONSTRAINT `fk_respuestas_comentarios_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  CONSTRAINT `fk_respuestas_comentarios_usuario_respondedor` FOREIGN KEY (`id_usuario_respondedor`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `respuestas_comentarios`
--

LOCK TABLES `respuestas_comentarios` WRITE;
/*!40000 ALTER TABLE `respuestas_comentarios` DISABLE KEYS */;
INSERT INTO `respuestas_comentarios` VALUES (1,1,4,'Gracias por su retroalimentación, nos alegra saberlo.','2026-04-27 09:32:26'),(2,2,2,'El técnico asignado es Luis Martínez. Le contactará pronto.','2026-04-27 09:32:26'),(3,3,4,'Haremos lo posible para finalizar hoy. Le notificaremos.','2026-04-27 09:32:26'),(4,4,4,'Revisaremos el sistema de recordatorios, disculpe la molestia.','2026-04-27 09:32:26'),(5,5,2,'¡A usted por confiar en nuestros servicios!','2026-04-27 09:32:26');
/*!40000 ALTER TABLE `respuestas_comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador'),(2,'Tecnico'),(3,'Usuario');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_servicio`
--

DROP TABLE IF EXISTS `solicitudes_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes_servicio` (
  `id_solicitud_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_equipo` varchar(25) DEFAULT NULL,
  `id_tipo_servicio` int(11) DEFAULT NULL,
  `descripcion_problema` varchar(255) DEFAULT NULL,
  `id_prioridad` int(11) DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT current_timestamp(),
  `id_estado` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_solicitud_servicio`),
  KEY `id_usrs` (`id_usuario`),
  KEY `id_equipo` (`id_equipo`),
  KEY `id_tp_servicio` (`id_tipo_servicio`),
  KEY `id_prioridad` (`id_prioridad`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `fk_solicitudes_servicio_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `equipos` (`id_equipo`),
  CONSTRAINT `fk_solicitudes_servicio_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`),
  CONSTRAINT `fk_solicitudes_servicio_prioridad` FOREIGN KEY (`id_prioridad`) REFERENCES `prioridades` (`id_prioridad`),
  CONSTRAINT `fk_solicitudes_servicio_tipo_servicio` FOREIGN KEY (`id_tipo_servicio`) REFERENCES `tipos_servicio` (`id_tipo_servicio`),
  CONSTRAINT `fk_solicitudes_servicio_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_servicio`
--

LOCK TABLES `solicitudes_servicio` WRITE;
/*!40000 ALTER TABLE `solicitudes_servicio` DISABLE KEYS */;
INSERT INTO `solicitudes_servicio` VALUES (1,1,'EQ001-A',1,'El portátil está lento, requiere limpieza de hardware.',3,'2026-04-27 09:32:26',2),(2,3,'EQ003-P',4,'Pantalla rota tras una caída. Necesita reparación urgente.',4,'2026-04-27 09:32:26',3),(3,1,'EQ002-B',2,'Deseo cambiar de Windows 11 a Linux Ubuntu.',2,'2026-04-27 09:32:26',2),(4,5,'EQ004-M',5,'El touch del tablet a veces no responde.',1,'2026-04-27 09:32:26',2),(5,1,'EQ005-A',3,'La impresora no se conecta a la red Wi-Fi.',3,'2026-04-27 09:32:26',3),(6,8,NULL,5,'Solicitud de prueba fase servicios',3,'2026-06-03 03:11:17',4),(7,8,NULL,NULL,'Solicitud para cancelar fase servicios',1,'2026-06-03 03:11:17',5),(8,8,NULL,NULL,'Solicitud fase 3B asignacion tecnico',2,'2026-06-03 03:31:22',2),(9,9,NULL,NULL,'dfghjkv',2,'2026-06-04 04:38:19',2),(10,8,NULL,NULL,'Solicitud evento notificacion fase 3D',2,'2026-06-04 04:49:11',2),(11,8,NULL,NULL,'Solicitud evento services notificacion corregida',2,'2026-06-04 04:50:33',2),(12,8,NULL,NULL,'Prueba pago manual admin 2026-06-04T04:55:29.258Z',2,'2026-06-04 04:55:29',2),(13,9,NULL,NULL,'hola',2,'2026-06-04 05:00:55',2),(14,8,NULL,NULL,'Prueba coincidencia verificacion 2026-06-10T01:46:02.750Z',2,'2026-06-10 01:46:02',2),(15,8,NULL,NULL,'Prueba inconsistencia verificacion 2026-06-10T01:46:04.320Z',2,'2026-06-10 01:46:04',2),(16,8,NULL,NULL,'Prueba contador intento correcto 2026-06-10T01:46:40.671Z',2,'2026-06-10 01:46:40',2),(17,8,NULL,NULL,'Sync final coincidente 2026-06-10T01:59:05.197Z',2,'2026-06-10 01:59:05',2),(18,8,NULL,NULL,'Sync final inconsistente 2026-06-10T01:59:05.849Z',2,'2026-06-10 01:59:05',2),(19,9,NULL,NULL,'n1',2,'2026-06-10 02:12:38',4),(20,8,NULL,NULL,'Prueba selector tecnico 1781059105589',2,'2026-06-10 02:38:25',2),(21,9,NULL,NULL,'n2',2,'2026-06-10 02:44:23',2),(22,8,NULL,NULL,'Prueba tecnico nuevo 1781060673693',2,'2026-06-10 03:04:33',2),(23,9,NULL,NULL,'n3',2,'2026-06-10 03:36:29',4),(24,16,NULL,NULL,'hola',2,'2026-06-11 13:15:03',2),(25,16,NULL,NULL,'hhhh',2,'2026-06-16 02:04:23',5),(26,19,NULL,5,'PRUEBA_NOTIFICACIONES_U01 nueva solicitud 1781577108299',2,'2026-06-16 02:31:48',2),(27,19,NULL,5,'PRUEBA_NOTIFICACIONES_U02 solicitud a cancelar 1781577108424',2,'2026-06-16 02:31:48',5),(28,19,NULL,5,'PRUEBA_NOTIFICACIONES_U03 pago simulado 1781577108509',2,'2026-06-16 02:31:48',2),(29,19,NULL,5,'PRUEBA_NOTIFICACIONES_T01 1781577108723',2,'2026-06-16 02:31:48',2),(30,19,NULL,5,'PRUEBA_NOTIFICACIONES_T02_T03 1781577108933',2,'2026-06-16 02:31:48',2),(31,19,NULL,5,'PRUEBA_NOTIFICACIONES_S03 tecnico asignado 1781577109164',2,'2026-06-16 02:31:49',2),(32,19,NULL,5,'PRUEBA_NOTIFICACIONES_S04 cita programada 1781577109241',2,'2026-06-16 02:31:49',2),(33,19,NULL,5,'PRUEBA_NOTIFICACIONES_N06 multiples admins 1781577109550',2,'2026-06-16 02:31:49',2),(34,16,NULL,NULL,'jjjj',2,'2026-06-16 02:42:03',2);
/*!40000 ALTER TABLE `solicitudes_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_documento`
--

DROP TABLE IF EXISTS `tipos_documento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipos_documento` (
  `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_tipo_documento` varchar(50) DEFAULT NULL,
  `abreviatura_tipo_documento` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_documento`),
  UNIQUE KEY `nombre_tipo` (`nombre_tipo_documento`),
  UNIQUE KEY `tipo_abreviado` (`abreviatura_tipo_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_documento`
--

LOCK TABLES `tipos_documento` WRITE;
/*!40000 ALTER TABLE `tipos_documento` DISABLE KEYS */;
INSERT INTO `tipos_documento` VALUES (1,'Cédula de Ciudadanía','CC'),(2,'Tarjeta de Identidad','TI'),(3,'Cédula de Extranjería','CE'),(4,'Pasaporte','PAS'),(5,'Documento de Identidad','DNI');
/*!40000 ALTER TABLE `tipos_documento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_notificacion`
--

DROP TABLE IF EXISTS `tipos_notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipos_notificacion` (
  `id_tipo_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_tipo_notificacion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_notificacion`),
  UNIQUE KEY `nombre_tipo` (`nombre_tipo_notificacion`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_notificacion`
--

LOCK TABLES `tipos_notificacion` WRITE;
/*!40000 ALTER TABLE `tipos_notificacion` DISABLE KEYS */;
INSERT INTO `tipos_notificacion` VALUES (2,'Cita Confirmada'),(5,'Comentario Nuevo'),(3,'Pago Recibido'),(4,'Recordatorio de Cita'),(1,'Solicitud Creada');
/*!40000 ALTER TABLE `tipos_notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipos_servicio`
--

DROP TABLE IF EXISTS `tipos_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipos_servicio` (
  `id_tipo_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_servicio` varchar(150) DEFAULT NULL,
  `descripcion_servicio` varchar(225) DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_servicio`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipos_servicio`
--

LOCK TABLES `tipos_servicio` WRITE;
/*!40000 ALTER TABLE `tipos_servicio` DISABLE KEYS */;
INSERT INTO `tipos_servicio` VALUES (1,'Mantenimiento Preventivo PC','Limpieza interna, optimización de software.',45.00),(2,'Instalación de SO','Formateo e instalación de Windows/Linux.',75.00),(3,'Revisión de Red Doméstica','Diagnóstico y configuración de router/Wi-Fi.',50.00),(4,'Reparación de Pantalla Móvil','Reemplazo de pantalla en smartphone o tablet.',120.00),(5,'Asistencia Remota','Soporte técnico por internet para problemas leves.',30.00);
/*!40000 ALTER TABLE `tipos_servicio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ubicaciones_tecnicos`
--

DROP TABLE IF EXISTS `ubicaciones_tecnicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ubicaciones_tecnicos` (
  `id_ubicacion_tecnico` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_ubicacion_tecnico`),
  KEY `id_usrs` (`id_usuario`),
  CONSTRAINT `fk_ubicaciones_tecnicos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicaciones_tecnicos`
--

LOCK TABLES `ubicaciones_tecnicos` WRITE;
/*!40000 ALTER TABLE `ubicaciones_tecnicos` DISABLE KEYS */;
INSERT INTO `ubicaciones_tecnicos` VALUES (1,2,4.71100000,-74.07210000,'2026-04-27 09:32:26'),(2,2,4.71150000,-74.07250000,'2026-04-27 09:32:26'),(3,2,4.60980000,-74.08170000,'2026-04-27 09:32:26'),(4,2,4.62890000,-74.06380000,'2026-04-27 09:32:26'),(5,2,4.69000000,-74.07500000,'2026-04-27 09:32:26');
/*!40000 ALTER TABLE `ubicaciones_tecnicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `id_tipo_documento` int(11) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `contrasena_hash` varchar(255) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `id_area_especialidad` int(11) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `id_rol` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `id_tp_doc` (`id_tipo_documento`),
  KEY `id_area` (`id_area_especialidad`),
  KEY `id_rol` (`id_rol`),
  CONSTRAINT `fk_usuarios_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`),
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`),
  CONSTRAINT `fk_usuarios_tipo_documento` FOREIGN KEY (`id_tipo_documento`) REFERENCES `tipos_documento` (`id_tipo_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'Ana','García','ana.garcia@email.com','claveAna','3001234567','Calle 10 # 1-1A',NULL,'2026-04-27 09:32:25',3,1),(2,1,'Luis','Martínez','luis.martinez@email.com','claveLuis','3017654321','Avenida 5 # 2B-2C',3,'2026-04-27 09:32:25',2,1),(3,4,'Pedro','López','pedro.lopez@email.com','clavePedro','3025556677','Carrera 8 # 3-3D',NULL,'2026-04-27 09:32:25',3,1),(4,1,'Sofía','Rodríguez','sofia.rodri@email.com','claveSofia','3034445588','Transversal 12 # 4-4E',3,'2026-04-27 09:32:25',2,1),(5,3,'María','Fernández','maria.f@email.com','claveMaria','3049991122','Diagonal 15 # 5F-6G',NULL,'2026-04-27 09:32:25',3,1),(6,NULL,'Admin','FuturApp','admin@futurapp.com','$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK','3000000000',NULL,2,'2026-06-03 02:59:26',2,1),(7,NULL,'Tecnico','FuturApp','tecnico@futurapp.com','$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK','3100000000',NULL,1,'2026-06-03 02:59:26',2,1),(8,NULL,'Usuario','FuturApp','usuario@futurapp.com','$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK','3200000000',NULL,NULL,'2026-06-03 02:59:26',3,1),(9,NULL,'Desarrollo','IA','desarrolloia616@gmail.com','$2b$10$g7ztfFOlZtiRoJ/cPbNtHeiqD0sprjlB2G9UPDebUb27S.CiauAyS',NULL,NULL,NULL,'2026-06-04 04:37:57',3,1),(10,NULL,'Desarrolloadmin','IA','este@11.com','$2b$10$9Mgm3wALr8fv7HPmw4zMZOn4P9lZrDy6xO0HSwzh52Oh9nltAZTb6',NULL,NULL,NULL,'2026-06-04 04:39:24',1,1),(11,NULL,'tecnico','IA','desarr16@gmail.com','$2b$10$MZBPbVbE7yU6guy5E6mcxu31/73Mae/3WR0nA7ImKk2veA1Gre5bS',NULL,NULL,1,'2026-06-10 02:14:37',2,1),(12,NULL,'Tecnico','Inactivo Prueba','tecnico.inactivo.prueba@futurapp.local','$2b$10$ApXH3aIju0ERrqdiS2rzjOzma8bO6gDiIB0X.aAEd9t7MlnWrBt6.',NULL,NULL,NULL,'2026-06-10 02:38:25',3,1),(13,NULL,'Gestion','Usuario Prueba','gestion.usuario.prueba@futurapp.local','$2b$10$uH8ufaGE6uhqy9StmlX7euszoUQouhgNHAIoXG9gH8kpQFcMEudAm',NULL,NULL,NULL,'2026-06-10 03:02:38',3,1),(14,NULL,'Estefanía','Garzón','tefi281953@gmail.com','$2b$10$D7elDHgzqUk99QVzbAZ.iOXFlOCMM2bXQ/pZTRRs35K4Ia4xRBDXW',NULL,NULL,NULL,'2026-06-11 13:09:50',1,1),(15,NULL,'hyun','diaz','hyundiaz@gmail.com','$2b$10$DDDmD2656TYe8OnhB.Pk5eKK2wXhhUXCY0sjiQePRMG.hEBnbKOr6',NULL,NULL,1,'2026-06-11 13:11:52',2,1),(16,NULL,'Angelina','Redondo','angelina@gmail.com','$2b$10$QZgCjSelJsJFrZcMSAE5rO6aGeCW7upRE2nVRHCWrB9uDHsHeyjI2',NULL,NULL,NULL,'2026-06-11 13:14:46',3,1),(17,NULL,'PRUEBA_NOTIFICACIONES','Admin A','prueba_notificaciones_admin_a@futurapp.local','$2b$10$L39rq3k/8q3IiwafWmG51u0/yDZPPNsEaT481gpCYA9VXAysNn2Y2',NULL,NULL,NULL,'2026-06-16 02:31:47',1,1),(18,NULL,'PRUEBA_NOTIFICACIONES','Admin B','prueba_notificaciones_admin_b@futurapp.local','$2b$10$M/0wfDbmtCJSww9waEAX1ud261IhRVzz1QbMiYkVoKVIKy6q19oh.',NULL,NULL,NULL,'2026-06-16 02:31:47',1,1),(19,NULL,'PRUEBA_NOTIFICACIONES','Usuario','prueba_notificaciones_usuario@futurapp.local','$2b$10$gmcoa363e6EJu2Bgl1GOyO4C1bXA8KMPzrDDnlTf24GYEJ9.JkD6m',NULL,NULL,NULL,'2026-06-16 02:31:47',3,1),(20,NULL,'PRUEBA_NOTIFICACIONES','Tecnico','prueba_notificaciones_tecnico@futurapp.local','$2b$10$/GRb7sEMSief3unRzViPOuSoDI1Zg9CUEjDjp2ALZb8L2UR8rU6Nu',NULL,NULL,5,'2026-06-16 02:31:47',2,1);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verificaciones_pago`
--

DROP TABLE IF EXISTS `verificaciones_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `verificaciones_pago` (
  `id_verificacion_pago` int(11) NOT NULL AUTO_INCREMENT,
  `id_pago` int(11) NOT NULL,
  `id_usuario_tecnico` int(11) DEFAULT NULL,
  `id_medio_pago_tecnico` int(11) DEFAULT NULL,
  `cantidad_intentos` int(11) NOT NULL DEFAULT 0,
  `metodos_coinciden` tinyint(1) DEFAULT NULL,
  `requiere_revision` tinyint(1) NOT NULL DEFAULT 0,
  `observacion` text DEFAULT NULL,
  `fecha_primer_intento` datetime DEFAULT NULL,
  `fecha_confirmacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_verificacion_pago`),
  UNIQUE KEY `uq_verificaciones_pago_id_pago` (`id_pago`),
  KEY `idx_verificaciones_pago_id_usuario_tecnico` (`id_usuario_tecnico`),
  KEY `idx_verificaciones_pago_id_medio_pago_tecnico` (`id_medio_pago_tecnico`),
  CONSTRAINT `fk_verificaciones_pago_medio_pago_tecnico` FOREIGN KEY (`id_medio_pago_tecnico`) REFERENCES `medios_pago` (`id_medio_pago`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_verificaciones_pago_pago` FOREIGN KEY (`id_pago`) REFERENCES `pagos` (`id_pago`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_verificaciones_pago_usuario_tecnico` FOREIGN KEY (`id_usuario_tecnico`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verificaciones_pago`
--

LOCK TABLES `verificaciones_pago` WRITE;
/*!40000 ALTER TABLE `verificaciones_pago` DISABLE KEYS */;
INSERT INTO `verificaciones_pago` VALUES (1,9,7,7,0,1,0,NULL,'2026-06-10 01:46:04','2026-06-10 01:46:04'),(2,10,7,3,2,0,1,'El usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo.','2026-06-10 01:46:04','2026-06-10 01:46:04'),(3,11,7,7,1,1,0,NULL,'2026-06-10 01:46:41','2026-06-10 01:46:41'),(4,12,7,7,1,1,0,NULL,'2026-06-10 01:59:05','2026-06-10 01:59:05'),(5,13,7,3,2,0,1,'El usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo.','2026-06-10 01:59:06','2026-06-10 01:59:06'),(6,14,NULL,NULL,0,NULL,0,NULL,NULL,NULL),(7,15,NULL,NULL,0,NULL,0,NULL,NULL,NULL),(8,16,11,7,1,1,0,NULL,'2026-06-10 02:47:29','2026-06-10 02:47:29'),(9,17,11,6,2,1,0,NULL,'2026-06-10 03:39:15','2026-06-10 03:39:28'),(10,18,15,6,1,1,0,NULL,'2026-06-11 13:18:34','2026-06-11 13:18:34'),(11,20,NULL,NULL,0,NULL,0,NULL,NULL,NULL),(12,21,20,7,1,1,0,NULL,'2026-06-16 02:31:48','2026-06-16 02:31:48'),(13,22,20,3,2,0,1,'El usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo.','2026-06-16 02:31:49','2026-06-16 02:31:49'),(14,24,15,7,1,1,0,NULL,'2026-06-16 02:45:06','2026-06-16 02:45:06');
/*!40000 ALTER TABLE `verificaciones_pago` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-15 22:33:59
