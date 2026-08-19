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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas_especialidad`
--

LOCK TABLES `areas_especialidad` WRITE;
/*!40000 ALTER TABLE `areas_especialidad` DISABLE KEYS */;
INSERT INTO `areas_especialidad` VALUES (3,'Hardware'),(2,'Redes'),(4,'Software'),(1,'Soporte General');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
INSERT INTO `citas` VALUES (1,1,1,NULL,'2025-11-25','10:00:00',1,2),(2,3,1,NULL,'2025-11-26','14:30:00',0,2),(3,2,3,NULL,'2025-11-21','09:00:00',1,4),(4,5,1,NULL,'2025-11-20','16:00:00',1,2),(5,4,5,NULL,'2025-11-28','11:00:00',0,2),(6,8,8,7,'2026-06-10','14:30:00',1,2),(7,9,9,2,'2026-06-04','09:00:00',1,2),(8,10,8,7,'2026-06-11','09:15:00',1,2),(9,11,8,7,NULL,NULL,0,2),(10,12,8,7,'2026-06-05','10:00:00',1,2),(11,13,9,2,NULL,NULL,0,2),(12,14,8,7,'2026-06-15','10:00:00',1,2),(13,15,8,7,'2026-06-15','10:00:00',1,2),(14,16,8,7,'2026-06-16','09:00:00',1,2);
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medios_pago`
--

LOCK TABLES `medios_pago` WRITE;
/*!40000 ALTER TABLE `medios_pago` DISABLE KEYS */;
INSERT INTO `medios_pago` VALUES (5,'Criptomonedas'),(7,'DaviPlata'),(6,'Nequi'),(3,'Pago en Efectivo'),(4,'PayPal'),(1,'Tarjeta de Crédito'),(2,'Transferencia Bancaria');
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
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,1,1,'Solicitud Recibida','Su solicitud #1 ha sido recibida con éxito.',1,'2026-04-27 09:32:26'),(2,3,2,'Cita Confirmada','Su cita para la solicitud #2 está confirmada.',0,'2026-04-27 09:32:26'),(3,1,4,'Recordatorio de Cita','Tiene una cita mañana a las 10:00 AM.',0,'2026-04-27 09:32:26'),(4,5,1,'Solicitud Recibida','Su solicitud #4 ha sido recibida.',1,'2026-04-27 09:32:26'),(5,1,3,'Pago Registrado','Hemos recibido el pago de su servicio #2.',1,'2026-04-27 09:32:26'),(6,8,1,'Prueba admin fase 3D','Notificacion creada por admin',1,'2026-06-04 04:49:10'),(7,8,1,'Prueba propia fase 3D','Notificacion propia',1,'2026-06-04 04:49:11'),(8,8,1,'Solicitud creada','Tu solicitud #10 fue creada correctamente.',0,'2026-06-04 04:49:11'),(9,8,2,'Cita programada','La cita #8 fue programada para 2026-06-11.',0,'2026-06-04 04:49:11'),(10,7,2,'Cita programada','La cita #8 fue programada para 2026-06-11.',0,'2026-06-04 04:49:11'),(11,8,3,'Pago confirmado','El tecnico confirmo el pago #7.',0,'2026-06-04 04:49:11'),(12,8,1,'Solicitud creada','Tu solicitud #11 fue creada correctamente.',0,'2026-06-04 04:50:33'),(13,7,1,'Servicio asignado','Se te asigno la solicitud #11.',0,'2026-06-04 04:50:33'),(14,8,1,'Tecnico asignado','Tu solicitud #11 ya tiene tecnico asignado.',0,'2026-06-04 04:50:33'),(15,8,1,'Solicitud creada','Tu solicitud #12 fue creada correctamente.',0,'2026-06-04 04:55:29'),(16,7,1,'Servicio asignado','Se te asigno la solicitud #12.',0,'2026-06-04 04:55:29'),(17,8,1,'Tecnico asignado','Tu solicitud #12 ya tiene tecnico asignado.',0,'2026-06-04 04:55:29'),(18,8,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',0,'2026-06-04 04:55:29'),(19,7,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',0,'2026-06-04 04:55:29'),(20,8,3,'Pago registrado','El pago #8 fue marcado como Pagado.',0,'2026-06-04 04:56:35'),(21,7,3,'Pago recibido','Se registro el pago #8 de una cita asignada a ti.',0,'2026-06-04 04:56:35'),(22,8,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',0,'2026-06-04 04:56:35'),(23,7,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',0,'2026-06-04 04:56:35'),(24,8,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',0,'2026-06-04 04:58:02'),(25,7,2,'Cita programada','La cita #10 fue programada para 2026-06-05.',0,'2026-06-04 04:58:02'),(26,9,1,'Solicitud creada','Tu solicitud #13 fue creada correctamente.',0,'2026-06-04 05:00:55'),(27,2,1,'Servicio asignado','Se te asigno la solicitud #13.',0,'2026-06-04 05:01:33'),(28,9,1,'Tecnico asignado','Tu solicitud #13 ya tiene tecnico asignado.',0,'2026-06-04 05:01:33'),(29,8,1,'Solicitud creada','Tu solicitud #14 fue creada correctamente.',0,'2026-06-10 01:46:03'),(30,7,1,'Servicio asignado','Se te asigno la solicitud #14.',0,'2026-06-10 01:46:03'),(31,8,1,'Tecnico asignado','Tu solicitud #14 ya tiene tecnico asignado.',0,'2026-06-10 01:46:03'),(32,8,3,'Pago pendiente','Tu solicitud #14 tiene un pago pendiente por $120.000 COP.',0,'2026-06-10 01:46:03'),(33,7,1,'Servicio asignado','Se te asigno la solicitud #14.',0,'2026-06-10 01:46:03'),(34,8,1,'Tecnico asignado','Tu solicitud #14 ya tiene tecnico asignado.',0,'2026-06-10 01:46:03'),(35,8,3,'Pago pendiente','Tu solicitud #14 tiene un pago pendiente por $121.000 COP.',0,'2026-06-10 01:46:03'),(36,8,2,'Cita programada','La cita #12 fue programada para 2026-06-15.',0,'2026-06-10 01:46:03'),(37,7,2,'Cita programada','La cita #12 fue programada para 2026-06-15.',0,'2026-06-10 01:46:03'),(38,8,3,'Pago registrado','El pago #9 fue marcado como Pagado.',0,'2026-06-10 01:46:04'),(39,7,3,'Pago recibido','Se registro el pago #9 de una cita asignada a ti.',0,'2026-06-10 01:46:04'),(40,8,3,'Pago confirmado','El tecnico confirmo el pago #9.',0,'2026-06-10 01:46:04'),(41,8,1,'Solicitud creada','Tu solicitud #15 fue creada correctamente.',0,'2026-06-10 01:46:04'),(42,7,1,'Servicio asignado','Se te asigno la solicitud #15.',0,'2026-06-10 01:46:04'),(43,8,1,'Tecnico asignado','Tu solicitud #15 ya tiene tecnico asignado.',0,'2026-06-10 01:46:04'),(44,8,3,'Pago pendiente','Tu solicitud #15 tiene un pago pendiente por $130.000 COP.',0,'2026-06-10 01:46:04'),(45,7,1,'Servicio asignado','Se te asigno la solicitud #15.',0,'2026-06-10 01:46:04'),(46,8,1,'Tecnico asignado','Tu solicitud #15 ya tiene tecnico asignado.',0,'2026-06-10 01:46:04'),(47,8,3,'Pago pendiente','Tu solicitud #15 tiene un pago pendiente por $131.000 COP.',0,'2026-06-10 01:46:04'),(48,8,2,'Cita programada','La cita #13 fue programada para 2026-06-15.',0,'2026-06-10 01:46:04'),(49,7,2,'Cita programada','La cita #13 fue programada para 2026-06-15.',0,'2026-06-10 01:46:04'),(50,8,3,'Pago registrado','El pago #10 fue marcado como Pagado.',0,'2026-06-10 01:46:04'),(51,7,3,'Pago recibido','Se registro el pago #10 de una cita asignada a ti.',0,'2026-06-10 01:46:04'),(52,8,3,'Pago confirmado con observacion','El tecnico confirmo el pago #10 con diferencia de metodo.',0,'2026-06-10 01:46:04'),(53,4,3,'Revision de pago requerida','El pago #10 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',0,'2026-06-10 01:46:04'),(54,6,3,'Revision de pago requerida','El pago #10 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',0,'2026-06-10 01:46:05'),(55,10,3,'Revision de pago requerida','El pago #10 tiene metodos no coincidentes: usuario DaviPlata, tecnico Pago en Efectivo.',0,'2026-06-10 01:46:05'),(56,8,1,'Solicitud creada','Tu solicitud #16 fue creada correctamente.',0,'2026-06-10 01:46:40'),(57,7,1,'Servicio asignado','Se te asigno la solicitud #16.',0,'2026-06-10 01:46:40'),(58,8,1,'Tecnico asignado','Tu solicitud #16 ya tiene tecnico asignado.',0,'2026-06-10 01:46:40'),(59,8,3,'Pago pendiente','Tu solicitud #16 tiene un pago pendiente por $140.000 COP.',0,'2026-06-10 01:46:41'),(60,8,2,'Cita programada','La cita #14 fue programada para 2026-06-16.',0,'2026-06-10 01:46:41'),(61,7,2,'Cita programada','La cita #14 fue programada para 2026-06-16.',0,'2026-06-10 01:46:41'),(62,8,3,'Pago registrado','El pago #11 fue marcado como Pagado.',0,'2026-06-10 01:46:41'),(63,7,3,'Pago recibido','Se registro el pago #11 de una cita asignada a ti.',0,'2026-06-10 01:46:41'),(64,8,3,'Pago confirmado','El tecnico confirmo el pago #11.',0,'2026-06-10 01:46:41');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,3,1,2,3,120.00,'2026-04-27 09:32:26','Ref: TRJ-00123456'),(2,3,2,2,3,75.00,'2026-04-27 09:32:26','Ref: BAN-98765432'),(3,1,3,1,1,45.00,'2026-04-27 09:32:26','Pendiente efectivo a la llegada'),(4,5,1,3,5,30.00,'2026-04-27 09:32:26','Pago fallido con tarjeta'),(5,2,2,4,1,75.00,'2026-04-27 09:32:26','Reembolso por cancelación de servicio'),(6,6,3,2,8,100.00,'2026-06-04 04:33:22','Pago usuario fase 3C'),(7,6,2,2,8,200.00,'2026-06-04 04:49:11','Evento pago notificacion fase 3D'),(8,10,6,2,8,90000.00,'2026-06-04 04:56:35','Pago simulado: 2026-06-04T04:56:35.113Z'),(9,12,7,2,8,121000.00,'2026-06-10 01:46:04','Pago simulado: 2026-06-10T01:46:04.006Z'),(10,13,7,2,8,131000.00,'2026-06-10 01:46:04','Pago simulado: 2026-06-10T01:46:04.707Z'),(11,14,7,2,8,140000.00,'2026-06-10 01:46:41','Pago simulado: 2026-06-10T01:46:41.119Z');
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
INSERT INTO `roles` VALUES (1,'Administrador'),(3,'Cliente'),(4,'Soporte'),(2,'Técnico'),(5,'Visitante');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_servicio`
--

LOCK TABLES `solicitudes_servicio` WRITE;
/*!40000 ALTER TABLE `solicitudes_servicio` DISABLE KEYS */;
INSERT INTO `solicitudes_servicio` VALUES (1,1,'EQ001-A',1,'El portátil está lento, requiere limpieza de hardware.',3,'2026-04-27 09:32:26',2),(2,3,'EQ003-P',4,'Pantalla rota tras una caída. Necesita reparación urgente.',4,'2026-04-27 09:32:26',3),(3,1,'EQ002-B',2,'Deseo cambiar de Windows 11 a Linux Ubuntu.',2,'2026-04-27 09:32:26',2),(4,5,'EQ004-M',5,'El touch del tablet a veces no responde.',1,'2026-04-27 09:32:26',2),(5,1,'EQ005-A',3,'La impresora no se conecta a la red Wi-Fi.',3,'2026-04-27 09:32:26',3),(6,8,NULL,5,'Solicitud de prueba fase servicios',3,'2026-06-03 03:11:17',4),(7,8,NULL,NULL,'Solicitud para cancelar fase servicios',1,'2026-06-03 03:11:17',5),(8,8,NULL,NULL,'Solicitud fase 3B asignacion tecnico',2,'2026-06-03 03:31:22',2),(9,9,NULL,NULL,'dfghjkv',2,'2026-06-04 04:38:19',2),(10,8,NULL,NULL,'Solicitud evento notificacion fase 3D',2,'2026-06-04 04:49:11',2),(11,8,NULL,NULL,'Solicitud evento services notificacion corregida',2,'2026-06-04 04:50:33',2),(12,8,NULL,NULL,'Prueba pago manual admin 2026-06-04T04:55:29.258Z',2,'2026-06-04 04:55:29',2),(13,9,NULL,NULL,'hola',2,'2026-06-04 05:00:55',2),(14,8,NULL,NULL,'Prueba coincidencia verificacion 2026-06-10T01:46:02.750Z',2,'2026-06-10 01:46:02',2),(15,8,NULL,NULL,'Prueba inconsistencia verificacion 2026-06-10T01:46:04.320Z',2,'2026-06-10 01:46:04',2),(16,8,NULL,NULL,'Prueba contador intento correcto 2026-06-10T01:46:40.671Z',2,'2026-06-10 01:46:40',2);
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'Ana','García','ana.garcia@email.com','claveAna','3001234567','Calle 10 # 1-1A',NULL,'2026-04-27 09:32:25',3,1),(2,1,'Luis','Martínez','luis.martinez@email.com','claveLuis','3017654321','Avenida 5 # 2B-2C',3,'2026-04-27 09:32:25',2,1),(3,4,'Pedro','López','pedro.lopez@email.com','clavePedro','3025556677','Carrera 8 # 3-3D',NULL,'2026-04-27 09:32:25',3,1),(4,1,'Sofía','Rodríguez','sofia.rodri@email.com','claveSofia','3034445588','Transversal 12 # 4-4E',1,'2026-04-27 09:32:25',1,1),(5,3,'María','Fernández','maria.f@email.com','claveMaria','3049991122','Diagonal 15 # 5F-6G',NULL,'2026-04-27 09:32:25',3,1),(6,NULL,'Admin','FuturApp','admin@futurapp.com','$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK','3000000000',NULL,NULL,'2026-06-03 02:59:26',1,1),(7,NULL,'Tecnico','FuturApp','tecnico@futurapp.com','$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK','3100000000',NULL,NULL,'2026-06-03 02:59:26',2,1),(8,NULL,'Usuario','FuturApp','usuario@futurapp.com','$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK','3200000000',NULL,NULL,'2026-06-03 02:59:26',3,1),(9,NULL,'Desarrollo','IA','desarrolloia616@gmail.com','$2b$10$g7ztfFOlZtiRoJ/cPbNtHeiqD0sprjlB2G9UPDebUb27S.CiauAyS',NULL,NULL,NULL,'2026-06-04 04:37:57',3,1),(10,NULL,'Desarrolloadmin','IA','este@11.com','$2b$10$9Mgm3wALr8fv7HPmw4zMZOn4P9lZrDy6xO0HSwzh52Oh9nltAZTb6',NULL,NULL,NULL,'2026-06-04 04:39:24',1,1);
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verificaciones_pago`
--

LOCK TABLES `verificaciones_pago` WRITE;
/*!40000 ALTER TABLE `verificaciones_pago` DISABLE KEYS */;
INSERT INTO `verificaciones_pago` VALUES (1,9,7,7,0,1,0,NULL,'2026-06-10 01:46:04','2026-06-10 01:46:04'),(2,10,7,3,2,0,1,'El usuario reporto DaviPlata y el tecnico reporto Pago en Efectivo.','2026-06-10 01:46:04','2026-06-10 01:46:04'),(3,11,7,7,1,1,0,NULL,'2026-06-10 01:46:41','2026-06-10 01:46:41');
/*!40000 ALTER TABLE `verificaciones_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'futurapp'
--

--
-- Dumping routines for database 'futurapp'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-09 20:55:49
