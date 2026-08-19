-- FuturApp backup before final cleanup
-- Generated: 2026-06-04T12:46:10.166Z
-- Source: current DATABASE_URL schema
-- Generated without mysqldump; all row values are emitted as SQL literals from CAST(... AS CHAR).
SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

DROP TABLE IF EXISTS `areas_especialidad`;
CREATE TABLE `areas_especialidad` (
  `id_area_especialidad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_area_especialidad` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_area_especialidad`),
  UNIQUE KEY `nombre_area` (`nombre_area_especialidad`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `areas_especialidad` (`id_area_especialidad`, `nombre_area_especialidad`) VALUES ('3', 'Hardware');
INSERT INTO `areas_especialidad` (`id_area_especialidad`, `nombre_area_especialidad`) VALUES ('2', 'Redes');
INSERT INTO `areas_especialidad` (`id_area_especialidad`, `nombre_area_especialidad`) VALUES ('4', 'Software');
INSERT INTO `areas_especialidad` (`id_area_especialidad`, `nombre_area_especialidad`) VALUES ('1', 'Soporte General');

DROP TABLE IF EXISTS `asesorias`;
CREATE TABLE `asesorias` (
  `id_asesoria` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) DEFAULT NULL,
  `id_area_especialidad` int(11) DEFAULT NULL,
  `id_empleado` int(11) DEFAULT NULL,
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
  KEY `id` (`id_empleado`),
  KEY `id_comentario` (`id_comentario`),
  KEY `id_notificacion` (`id_notificacion`),
  CONSTRAINT `fk_asesorias_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`),
  CONSTRAINT `fk_asesorias_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  CONSTRAINT `fk_asesorias_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`),
  CONSTRAINT `fk_asesorias_notificacion` FOREIGN KEY (`id_notificacion`) REFERENCES `notificaciones` (`id_notificacion`),
  CONSTRAINT `fk_asesorias_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `ayudas`;
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

DROP TABLE IF EXISTS `citas`;
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('1', '1', '1', NULL, '2025-11-25', '10:00:00', '1', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('2', '3', '1', NULL, '2025-11-26', '14:30:00', '0', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('3', '2', '3', NULL, '2025-11-21', '09:00:00', '1', '4');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('4', '5', '1', NULL, '2025-11-20', '16:00:00', '1', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('5', '4', '5', NULL, '2025-11-28', '11:00:00', '0', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('6', '8', '8', '7', '2026-06-10', '14:30:00', '1', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('7', '9', '9', '2', '2026-06-04', '09:00:00', '1', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('8', '10', '8', '7', '2026-06-11', '09:15:00', '1', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('9', '11', '8', '7', NULL, NULL, '0', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('10', '12', '8', '7', '2026-06-05', '10:00:00', '1', '2');
INSERT INTO `citas` (`id_cita`, `id_solicitud_servicio`, `id_usuario_cliente`, `id_usuario_tecnico`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES ('11', '13', '9', '2', NULL, NULL, '0', '2');

DROP TABLE IF EXISTS `comentarios`;
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

INSERT INTO `comentarios` (`id_comentario`, `id_cita`, `fecha_comentario`, `id_usuario`) VALUES ('1', '3', '2026-04-27 09:32:26', NULL);
INSERT INTO `comentarios` (`id_comentario`, `id_cita`, `fecha_comentario`, `id_usuario`) VALUES ('2', '1', '2026-04-27 09:32:26', NULL);
INSERT INTO `comentarios` (`id_comentario`, `id_cita`, `fecha_comentario`, `id_usuario`) VALUES ('3', '4', '2026-04-27 09:32:26', NULL);
INSERT INTO `comentarios` (`id_comentario`, `id_cita`, `fecha_comentario`, `id_usuario`) VALUES ('4', '2', '2026-04-27 09:32:26', NULL);
INSERT INTO `comentarios` (`id_comentario`, `id_cita`, `fecha_comentario`, `id_usuario`) VALUES ('5', '3', '2026-04-27 09:32:26', NULL);

DROP TABLE IF EXISTS `empleados`;
CREATE TABLE `empleados` (
  `id_empleado` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `fecha_contratacion` date DEFAULT NULL,
  `salario` decimal(10,2) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `id_area_especialidad` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_empleado`),
  KEY `empleados_area` (`id_area_especialidad`),
  CONSTRAINT `fk_empleados_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `empleados` (`id_empleado`, `nombre`, `fecha_contratacion`, `salario`, `telefono`, `id_area_especialidad`) VALUES ('1', 'Sara Gomez', '2023-01-10', '2000000.00', NULL, NULL);
INSERT INTO `empleados` (`id_empleado`, `nombre`, `fecha_contratacion`, `salario`, `telefono`, `id_area_especialidad`) VALUES ('2', 'Juan Diaz', '2024-05-15', '1500000.00', NULL, NULL);
INSERT INTO `empleados` (`id_empleado`, `nombre`, `fecha_contratacion`, `salario`, `telefono`, `id_area_especialidad`) VALUES ('3', 'Laura Tellez', '0000-00-00', '1980000.00', NULL, NULL);

DROP TABLE IF EXISTS `equipos`;
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

INSERT INTO `equipos` (`id_equipo`, `id_usuario`, `tipo_equipo`, `marca_equipo`, `modelo_equipo`, `numero_serie`, `sistema_operativo`, `fecha_registro`, `id_estado`) VALUES ('EQ001-A', '1', 'Portátil', 'Dell', 'Inspiron 15', 'S/N-DELL001', 'Windows 10', '2026-04-27 09:32:26', '1');
INSERT INTO `equipos` (`id_equipo`, `id_usuario`, `tipo_equipo`, `marca_equipo`, `modelo_equipo`, `numero_serie`, `sistema_operativo`, `fecha_registro`, `id_estado`) VALUES ('EQ002-B', '1', 'PC de Escritorio', 'HP', 'ProDesk 400', 'S/N-HP002', 'Windows 11', '2026-04-27 09:32:26', '1');
INSERT INTO `equipos` (`id_equipo`, `id_usuario`, `tipo_equipo`, `marca_equipo`, `modelo_equipo`, `numero_serie`, `sistema_operativo`, `fecha_registro`, `id_estado`) VALUES ('EQ003-P', '3', 'Smartphone', 'Samsung', 'Galaxy S21', 'S/N-SAM003', 'Android 13', '2026-04-27 09:32:26', '1');
INSERT INTO `equipos` (`id_equipo`, `id_usuario`, `tipo_equipo`, `marca_equipo`, `modelo_equipo`, `numero_serie`, `sistema_operativo`, `fecha_registro`, `id_estado`) VALUES ('EQ004-M', '5', 'Tablet', 'Apple', 'iPad Air (4ta Gen)', 'S/N-APL004', 'iOS 16', '2026-04-27 09:32:26', '2');
INSERT INTO `equipos` (`id_equipo`, `id_usuario`, `tipo_equipo`, `marca_equipo`, `modelo_equipo`, `numero_serie`, `sistema_operativo`, `fecha_registro`, `id_estado`) VALUES ('EQ005-A', '1', 'Impresora', 'Epson', 'EcoTank L3150', 'S/N-EPS005', NULL, '2026-04-27 09:32:26', '1');

DROP TABLE IF EXISTS `estados`;
CREATE TABLE `estados` (
  `id_estado` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_estado` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `nombre_estado` (`nombre_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES ('1', 'Activo');
INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES ('5', 'Cancelado');
INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES ('3', 'En Progreso');
INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES ('4', 'Finalizado');
INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES ('2', 'Pendiente');

DROP TABLE IF EXISTS `estados_pago`;
CREATE TABLE `estados_pago` (
  `id_estado_pago` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_estado_pago` varchar(30) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_estado_pago`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `estados_pago` (`id_estado_pago`, `nombre_estado_pago`, `descripcion`) VALUES ('1', 'Pendiente de Pago', 'Esperando confirmación de la transacción.');
INSERT INTO `estados_pago` (`id_estado_pago`, `nombre_estado_pago`, `descripcion`) VALUES ('2', 'Pagado', 'El pago se ha completado exitosamente.');
INSERT INTO `estados_pago` (`id_estado_pago`, `nombre_estado_pago`, `descripcion`) VALUES ('3', 'Fallido', 'La transacción de pago no se pudo completar.');
INSERT INTO `estados_pago` (`id_estado_pago`, `nombre_estado_pago`, `descripcion`) VALUES ('4', 'Reembolsado', 'El monto total del pago fue devuelto.');
INSERT INTO `estados_pago` (`id_estado_pago`, `nombre_estado_pago`, `descripcion`) VALUES ('5', 'En Revisión', 'El pago está siendo verificado manualmente.');

DROP TABLE IF EXISTS `legacy_appointments_20260602_215008`;
CREATE TABLE `legacy_appointments_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `technicianId` int(11) DEFAULT NULL,
  `serviceId` int(11) DEFAULT NULL,
  `fecha` datetime(3) DEFAULT NULL,
  `hora` varchar(191) DEFAULT NULL,
  `contacto` varchar(191) DEFAULT NULL,
  `estado` enum('Pendiente','Programada','Completada','Cancelada') NOT NULL DEFAULT 'Pendiente',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `appointments_serviceId_key` (`serviceId`),
  KEY `appointments_userId_idx` (`userId`),
  KEY `appointments_technicianId_idx` (`technicianId`),
  KEY `appointments_serviceId_idx` (`serviceId`),
  CONSTRAINT `appointments_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `legacy_services_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `appointments_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `appointments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_appointments_20260602_215008` (`id`, `userId`, `technicianId`, `serviceId`, `fecha`, `hora`, `contacto`, `estado`, `createdAt`, `updatedAt`) VALUES ('1', '3', '2', '2', '2026-06-03 14:30:00.000', '14:30', '3200000000', 'Completada', '2026-06-02 20:58:06.040', '2026-06-02 21:24:50.170');
INSERT INTO `legacy_appointments_20260602_215008` (`id`, `userId`, `technicianId`, `serviceId`, `fecha`, `hora`, `contacto`, `estado`, `createdAt`, `updatedAt`) VALUES ('2', '3', '2', '1', NULL, NULL, '3200000000', 'Pendiente', '2026-06-02 20:58:06.049', '2026-06-02 21:16:51.210');
INSERT INTO `legacy_appointments_20260602_215008` (`id`, `userId`, `technicianId`, `serviceId`, `fecha`, `hora`, `contacto`, `estado`, `createdAt`, `updatedAt`) VALUES ('3', '6', '2', '5', NULL, NULL, NULL, 'Completada', '2026-06-02 22:25:09.488', '2026-06-02 22:25:44.341');

DROP TABLE IF EXISTS `legacy_comments_20260602_215008`;
CREATE TABLE `legacy_comments_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `text` text NOT NULL,
  `response` text DEFAULT NULL,
  `respondedBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `comments_userId_idx` (`userId`),
  CONSTRAINT `comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_comments_20260602_215008` (`id`, `userId`, `text`, `response`, `respondedBy`, `createdAt`, `updatedAt`) VALUES ('1', '3', 'Excelente atencion durante el diagnostico.', 'Gracias por confiar en FuturApp.', 'Admin FuturApp', '2026-06-02 20:58:06.073', '2026-06-02 20:58:06.073');

DROP TABLE IF EXISTS `legacy_notifications_20260602_215008`;
CREATE TABLE `legacy_notifications_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `message` varchar(191) NOT NULL,
  `type` varchar(191) DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_userId_idx` (`userId`),
  CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_notifications_20260602_215008` (`id`, `userId`, `message`, `type`, `read`, `createdAt`, `updatedAt`) VALUES ('1', '3', 'Tu servicio fue registrado correctamente.', 'servicio', '1', '2026-06-02 20:58:06.066', '2026-06-02 21:42:22.868');
INSERT INTO `legacy_notifications_20260602_215008` (`id`, `userId`, `message`, `type`, `read`, `createdAt`, `updatedAt`) VALUES ('2', '2', 'Tienes una cita programada.', 'cita', '1', '2026-06-02 20:58:06.066', '2026-06-02 22:22:06.581');
INSERT INTO `legacy_notifications_20260602_215008` (`id`, `userId`, `message`, `type`, `read`, `createdAt`, `updatedAt`) VALUES ('3', '1', 'Nuevo pago registrado en el sistema.', 'pago', '1', '2026-06-02 20:58:06.066', '2026-06-02 22:22:06.581');
INSERT INTO `legacy_notifications_20260602_215008` (`id`, `userId`, `message`, `type`, `read`, `createdAt`, `updatedAt`) VALUES ('4', '2', 'Tienes una cita programada.', 'cita', '1', '2026-06-02 21:24:50.136', '2026-06-02 22:22:06.581');
INSERT INTO `legacy_notifications_20260602_215008` (`id`, `userId`, `message`, `type`, `read`, `createdAt`, `updatedAt`) VALUES ('5', '3', 'Notificacion de prueba API MySQL', 'sistema', '1', '2026-06-02 21:42:22.776', '2026-06-02 21:42:22.840');

DROP TABLE IF EXISTS `legacy_payments_20260602_215008`;
CREATE TABLE `legacy_payments_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transactionId` varchar(191) DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `technicianId` int(11) DEFAULT NULL,
  `serviceId` int(11) DEFAULT NULL,
  `appointmentId` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `platformCommission` decimal(12,2) DEFAULT NULL,
  `technicianEarnings` decimal(12,2) DEFAULT NULL,
  `method` varchar(191) DEFAULT NULL,
  `status` enum('Pendiente','Pagado','Fallido','Reembolsado') NOT NULL DEFAULT 'Pendiente',
  `reference` varchar(191) DEFAULT NULL,
  `confirmedByTechnician` tinyint(1) NOT NULL DEFAULT 0,
  `confirmedAt` datetime(3) DEFAULT NULL,
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payments_transactionId_key` (`transactionId`),
  KEY `payments_userId_idx` (`userId`),
  KEY `payments_technicianId_idx` (`technicianId`),
  KEY `payments_serviceId_idx` (`serviceId`),
  KEY `payments_appointmentId_idx` (`appointmentId`),
  CONSTRAINT `payments_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `legacy_appointments_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `legacy_services_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_payments_20260602_215008` (`id`, `transactionId`, `userId`, `technicianId`, `serviceId`, `appointmentId`, `amount`, `platformCommission`, `technicianEarnings`, `method`, `status`, `reference`, `confirmedByTechnician`, `confirmedAt`, `paidAt`, `createdAt`, `updatedAt`) VALUES ('1', 'TXN-DEMO-PENDING', '3', '2', '2', '1', '80000.00', '20000.00', '60000.00', 'Nequi', 'Pagado', 'SRV-DEMO-001', '1', '2026-06-02 21:34:25.719', '2026-06-02 21:34:25.719', '2026-06-02 20:58:06.056', '2026-06-02 21:34:25.721');
INSERT INTO `legacy_payments_20260602_215008` (`id`, `transactionId`, `userId`, `technicianId`, `serviceId`, `appointmentId`, `amount`, `platformCommission`, `technicianEarnings`, `method`, `status`, `reference`, `confirmedByTechnician`, `confirmedAt`, `paidAt`, `createdAt`, `updatedAt`) VALUES ('2', 'TXN-DEMO-PAID', '3', '2', '2', '1', '80000.00', '20000.00', '60000.00', 'Nequi', 'Pagado', 'SRV-DEMO-002', '1', '2026-06-02 16:00:00.000', '2026-06-02 16:00:00.000', '2026-06-02 20:58:06.056', '2026-06-02 20:58:06.056');
INSERT INTO `legacy_payments_20260602_215008` (`id`, `transactionId`, `userId`, `technicianId`, `serviceId`, `appointmentId`, `amount`, `platformCommission`, `technicianEarnings`, `method`, `status`, `reference`, `confirmedByTechnician`, `confirmedAt`, `paidAt`, `createdAt`, `updatedAt`) VALUES ('3', 'TXN-DEMO-FAILED', '3', '2', '2', '1', '40000.00', '10000.00', '30000.00', 'DaviPlata', 'Fallido', 'SRV-DEMO-003', '0', NULL, NULL, '2026-06-02 20:58:06.056', '2026-06-02 20:58:06.056');

DROP TABLE IF EXISTS `legacy_roles_20260602_215008`;
CREATE TABLE `legacy_roles_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` enum('admin','tecnico','usuario') NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_roles_20260602_215008` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES ('1', 'admin', 'Administrador de FuturApp', '2026-06-02 20:58:05.957', '2026-06-02 20:58:05.957');
INSERT INTO `legacy_roles_20260602_215008` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES ('2', 'tecnico', 'Tecnico de servicios', '2026-06-02 20:58:05.957', '2026-06-02 20:58:05.957');
INSERT INTO `legacy_roles_20260602_215008` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES ('3', 'usuario', 'Usuario cliente', '2026-06-02 20:58:05.957', '2026-06-02 20:58:05.957');

DROP TABLE IF EXISTS `legacy_services_20260602_215008`;
CREATE TABLE `legacy_services_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `technicianId` int(11) DEFAULT NULL,
  `tipo` varchar(191) NOT NULL,
  `descripcion` varchar(191) DEFAULT NULL,
  `fecha` datetime(3) DEFAULT NULL,
  `prioridad` varchar(191) DEFAULT NULL,
  `estado` enum('Pendiente','Completado','Cancelado') NOT NULL DEFAULT 'Pendiente',
  `valor` decimal(12,2) DEFAULT NULL,
  `duracion` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `services_userId_idx` (`userId`),
  KEY `services_technicianId_idx` (`technicianId`),
  CONSTRAINT `services_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `services_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_services_20260602_215008` (`id`, `userId`, `technicianId`, `tipo`, `descripcion`, `fecha`, `prioridad`, `estado`, `valor`, `duracion`, `createdAt`, `updatedAt`) VALUES ('1', '3', '2', 'Mantenimiento de Hardware', 'Mi computador no enciende correctamente', NULL, 'Media', 'Pendiente', NULL, NULL, '2026-06-02 20:58:06.017', '2026-06-02 21:16:51.192');
INSERT INTO `legacy_services_20260602_215008` (`id`, `userId`, `technicianId`, `tipo`, `descripcion`, `fecha`, `prioridad`, `estado`, `valor`, `duracion`, `createdAt`, `updatedAt`) VALUES ('2', '3', '2', 'Mantenimiento preventivo de computador', 'Mantenimiento preventivo de computador', '2026-06-02 10:00:00.000', 'Media', 'Completado', '80000.00', '2 horas', '2026-06-02 20:58:06.026', '2026-06-02 20:58:06.026');
INSERT INTO `legacy_services_20260602_215008` (`id`, `userId`, `technicianId`, `tipo`, `descripcion`, `fecha`, `prioridad`, `estado`, `valor`, `duracion`, `createdAt`, `updatedAt`) VALUES ('3', '3', NULL, 'Soporte tecnico remoto', 'Servicio cancelado de prueba', NULL, 'Baja', 'Cancelado', NULL, NULL, '2026-06-02 20:58:06.035', '2026-06-02 20:58:06.035');
INSERT INTO `legacy_services_20260602_215008` (`id`, `userId`, `technicianId`, `tipo`, `descripcion`, `fecha`, `prioridad`, `estado`, `valor`, `duracion`, `createdAt`, `updatedAt`) VALUES ('4', '3', NULL, 'Pendiente por clasificar', 'Servicio creado desde prueba API', NULL, 'Pendiente por clasificar', 'Cancelado', NULL, NULL, '2026-06-02 21:16:50.850', '2026-06-02 21:16:50.988');
INSERT INTO `legacy_services_20260602_215008` (`id`, `userId`, `technicianId`, `tipo`, `descripcion`, `fecha`, `prioridad`, `estado`, `valor`, `duracion`, `createdAt`, `updatedAt`) VALUES ('5', '6', '2', 'Pendiente por clasificar', 'mantenimiento de software', NULL, 'Pendiente por clasificar', 'Pendiente', NULL, NULL, '2026-06-02 22:24:13.006', '2026-06-02 22:25:09.472');

DROP TABLE IF EXISTS `legacy_technician_locations_20260602_215008`;
CREATE TABLE `legacy_technician_locations_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `technicianId` int(11) NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `status` varchar(191) DEFAULT NULL,
  `recordedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `technician_locations_technicianId_idx` (`technicianId`),
  CONSTRAINT `technician_locations_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `legacy_users_20260602_215008` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_technician_locations_20260602_215008` (`id`, `technicianId`, `latitude`, `longitude`, `status`, `recordedAt`, `createdAt`, `updatedAt`) VALUES ('1', '2', '4.7110000', '-74.0721000', 'Disponible', '2026-06-02 20:58:06.083', '2026-06-02 20:58:06.083', '2026-06-02 20:58:06.083');

DROP TABLE IF EXISTS `legacy_users_20260602_215008`;
CREATE TABLE `legacy_users_20260602_215008` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roleId` int(11) DEFAULT NULL,
  `nombre` varchar(191) NOT NULL,
  `apellido` varchar(191) DEFAULT NULL,
  `correo` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `telefono` varchar(191) DEFAULT NULL,
  `area` varchar(191) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `userRole` enum('admin','tecnico','usuario') NOT NULL DEFAULT 'usuario',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `direccion` varchar(191) DEFAULT NULL,
  `numeroDocumento` varchar(191) DEFAULT NULL,
  `tipoDocumento` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_correo_key` (`correo`),
  KEY `users_roleId_fkey` (`roleId`),
  CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `legacy_roles_20260602_215008` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `legacy_users_20260602_215008` (`id`, `roleId`, `nombre`, `apellido`, `correo`, `passwordHash`, `telefono`, `area`, `activo`, `userRole`, `createdAt`, `updatedAt`, `direccion`, `numeroDocumento`, `tipoDocumento`) VALUES ('1', '1', 'Admin', 'FuturApp', 'admin@futurapp.com', '$2b$10$6oZar07eV8z6WIPUSZl0CuvUQhAEWhqOdkZoeTAtwzhp/D/1aoQea', '300165053', NULL, '1', 'admin', '2026-06-02 20:58:05.974', '2026-06-02 21:50:53.405', 'Bogota prueba admin', 'DOC165053', 'CC');
INSERT INTO `legacy_users_20260602_215008` (`id`, `roleId`, `nombre`, `apellido`, `correo`, `passwordHash`, `telefono`, `area`, `activo`, `userRole`, `createdAt`, `updatedAt`, `direccion`, `numeroDocumento`, `tipoDocumento`) VALUES ('2', '2', 'Juan Pablo', 'Martinez', 'tecnico@futurapp.com', '$2b$10$6oZar07eV8z6WIPUSZl0CuvUQhAEWhqOdkZoeTAtwzhp/D/1aoQea', '300165053', 'Hardware', '1', 'tecnico', '2026-06-02 20:58:05.983', '2026-06-02 21:50:53.298', 'Bogota prueba tecnico', 'DOC165053', 'CC');
INSERT INTO `legacy_users_20260602_215008` (`id`, `roleId`, `nombre`, `apellido`, `correo`, `passwordHash`, `telefono`, `area`, `activo`, `userRole`, `createdAt`, `updatedAt`, `direccion`, `numeroDocumento`, `tipoDocumento`) VALUES ('3', '3', 'Carlos Andres', 'Gomez', 'usuario@futurapp.com', '$2b$10$6oZar07eV8z6WIPUSZl0CuvUQhAEWhqOdkZoeTAtwzhp/D/1aoQea', '300165052', NULL, '1', 'usuario', '2026-06-02 20:58:05.989', '2026-06-02 21:50:53.015', 'Bogota prueba usuario', 'DOC165052', 'CC');
INSERT INTO `legacy_users_20260602_215008` (`id`, `roleId`, `nombre`, `apellido`, `correo`, `passwordHash`, `telefono`, `area`, `activo`, `userRole`, `createdAt`, `updatedAt`, `direccion`, `numeroDocumento`, `tipoDocumento`) VALUES ('4', '3', 'Nuevo', 'Usuario', 'nuevo-20260602155834@futurapp.com', '$2b$10$/PlGL80t3M2I2d.UD89cbuJU0i/M/PwZNLDWS3ZPNERv/pBdVx7hO', NULL, NULL, '1', 'usuario', '2026-06-02 20:58:35.059', '2026-06-02 20:58:35.059', NULL, NULL, NULL);
INSERT INTO `legacy_users_20260602_215008` (`id`, `roleId`, `nombre`, `apellido`, `correo`, `passwordHash`, `telefono`, `area`, `activo`, `userRole`, `createdAt`, `updatedAt`, `direccion`, `numeroDocumento`, `tipoDocumento`) VALUES ('5', '1', 'Desarrollo', 'IA', 'desarrolloia616@gmail.com', '$2b$10$lYgH16iITWzsSRMRM4.iw.f7yaAi5r6Y9LESmCtZYu2XtgOBLZMbO', '123456789', NULL, '1', 'usuario', '2026-06-02 22:19:04.591', '2026-06-02 22:20:24.224', 'desarrolloia616@gmail.com', NULL, NULL);
INSERT INTO `legacy_users_20260602_215008` (`id`, `roleId`, `nombre`, `apellido`, `correo`, `passwordHash`, `telefono`, `area`, `activo`, `userRole`, `createdAt`, `updatedAt`, `direccion`, `numeroDocumento`, `tipoDocumento`) VALUES ('6', '3', 'cliente', 'de prueba 1 1', 'este@11.com', '$2b$10$e/Tpq1a8r9bkMIyq3oXKsuycF0NbBoWSW8bHguukREbqoA8q8.6Rq', NULL, NULL, '1', 'usuario', '2026-06-02 22:23:30.301', '2026-06-02 22:23:30.301', NULL, NULL, NULL);

DROP TABLE IF EXISTS `medios_pago`;
CREATE TABLE `medios_pago` (
  `id_medio_pago` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_medio_pago` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_medio_pago`),
  UNIQUE KEY `nombre_medio` (`nombre_medio_pago`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `medios_pago` (`id_medio_pago`, `nombre_medio_pago`) VALUES ('5', 'Criptomonedas');
INSERT INTO `medios_pago` (`id_medio_pago`, `nombre_medio_pago`) VALUES ('6', 'Nequi');
INSERT INTO `medios_pago` (`id_medio_pago`, `nombre_medio_pago`) VALUES ('3', 'Pago en Efectivo');
INSERT INTO `medios_pago` (`id_medio_pago`, `nombre_medio_pago`) VALUES ('4', 'PayPal');
INSERT INTO `medios_pago` (`id_medio_pago`, `nombre_medio_pago`) VALUES ('1', 'Tarjeta de Crédito');
INSERT INTO `medios_pago` (`id_medio_pago`, `nombre_medio_pago`) VALUES ('2', 'Transferencia Bancaria');

DROP TABLE IF EXISTS `notificaciones`;
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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('1', '1', '1', 'Solicitud Recibida', 'Su solicitud #1 ha sido recibida con éxito.', '1', '2026-04-27 09:32:26');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('2', '3', '2', 'Cita Confirmada', 'Su cita para la solicitud #2 está confirmada.', '0', '2026-04-27 09:32:26');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('3', '1', '4', 'Recordatorio de Cita', 'Tiene una cita mañana a las 10:00 AM.', '0', '2026-04-27 09:32:26');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('4', '5', '1', 'Solicitud Recibida', 'Su solicitud #4 ha sido recibida.', '1', '2026-04-27 09:32:26');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('5', '1', '3', 'Pago Registrado', 'Hemos recibido el pago de su servicio #2.', '1', '2026-04-27 09:32:26');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('6', '8', '1', 'Prueba admin fase 3D', 'Notificacion creada por admin', '1', '2026-06-04 04:49:10');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('7', '8', '1', 'Prueba propia fase 3D', 'Notificacion propia', '1', '2026-06-04 04:49:11');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('8', '8', '1', 'Solicitud creada', 'Tu solicitud #10 fue creada correctamente.', '0', '2026-06-04 04:49:11');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('9', '8', '2', 'Cita programada', 'La cita #8 fue programada para 2026-06-11.', '0', '2026-06-04 04:49:11');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('10', '7', '2', 'Cita programada', 'La cita #8 fue programada para 2026-06-11.', '0', '2026-06-04 04:49:11');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('11', '8', '3', 'Pago confirmado', 'El tecnico confirmo el pago #7.', '0', '2026-06-04 04:49:11');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('12', '8', '1', 'Solicitud creada', 'Tu solicitud #11 fue creada correctamente.', '0', '2026-06-04 04:50:33');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('13', '7', '1', 'Servicio asignado', 'Se te asigno la solicitud #11.', '0', '2026-06-04 04:50:33');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('14', '8', '1', 'Tecnico asignado', 'Tu solicitud #11 ya tiene tecnico asignado.', '0', '2026-06-04 04:50:33');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('15', '8', '1', 'Solicitud creada', 'Tu solicitud #12 fue creada correctamente.', '0', '2026-06-04 04:55:29');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('16', '7', '1', 'Servicio asignado', 'Se te asigno la solicitud #12.', '0', '2026-06-04 04:55:29');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('17', '8', '1', 'Tecnico asignado', 'Tu solicitud #12 ya tiene tecnico asignado.', '0', '2026-06-04 04:55:29');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('18', '8', '2', 'Cita programada', 'La cita #10 fue programada para 2026-06-05.', '0', '2026-06-04 04:55:29');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('19', '7', '2', 'Cita programada', 'La cita #10 fue programada para 2026-06-05.', '0', '2026-06-04 04:55:29');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('20', '8', '3', 'Pago registrado', 'El pago #8 fue marcado como Pagado.', '0', '2026-06-04 04:56:35');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('21', '7', '3', 'Pago recibido', 'Se registro el pago #8 de una cita asignada a ti.', '0', '2026-06-04 04:56:35');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('22', '8', '2', 'Cita programada', 'La cita #10 fue programada para 2026-06-05.', '0', '2026-06-04 04:56:35');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('23', '7', '2', 'Cita programada', 'La cita #10 fue programada para 2026-06-05.', '0', '2026-06-04 04:56:35');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('24', '8', '2', 'Cita programada', 'La cita #10 fue programada para 2026-06-05.', '0', '2026-06-04 04:58:02');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('25', '7', '2', 'Cita programada', 'La cita #10 fue programada para 2026-06-05.', '0', '2026-06-04 04:58:02');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('26', '9', '1', 'Solicitud creada', 'Tu solicitud #13 fue creada correctamente.', '0', '2026-06-04 05:00:55');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('27', '2', '1', 'Servicio asignado', 'Se te asigno la solicitud #13.', '0', '2026-06-04 05:01:33');
INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `id_tipo_notificacion`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES ('28', '9', '1', 'Tecnico asignado', 'Tu solicitud #13 ya tiene tecnico asignado.', '0', '2026-06-04 05:01:33');

DROP TABLE IF EXISTS `pagos`;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('1', '3', '1', '2', '3', '120.00', '2026-04-27 09:32:26', 'Ref: TRJ-00123456');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('2', '3', '2', '2', '3', '75.00', '2026-04-27 09:32:26', 'Ref: BAN-98765432');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('3', '1', '3', '1', '1', '45.00', '2026-04-27 09:32:26', 'Pendiente efectivo a la llegada');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('4', '5', '1', '3', '5', '30.00', '2026-04-27 09:32:26', 'Pago fallido con tarjeta');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('5', '2', '2', '4', '1', '75.00', '2026-04-27 09:32:26', 'Reembolso por cancelación de servicio');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('6', '6', '3', '2', '8', '100.00', '2026-06-04 04:33:22', 'Pago usuario fase 3C');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('7', '6', '2', '2', '8', '200.00', '2026-06-04 04:49:11', 'Evento pago notificacion fase 3D');
INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio_pago`, `id_estado_pago`, `id_usuario`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES ('8', '10', '6', '2', '8', '90000.00', '2026-06-04 04:56:35', 'Pago simulado: 2026-06-04T04:56:35.113Z');

DROP TABLE IF EXISTS `prioridades`;
CREATE TABLE `prioridades` (
  `id_prioridad` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_prioridad` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_prioridad`),
  UNIQUE KEY `nombre_prioridad` (`nombre_prioridad`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `prioridades` (`id_prioridad`, `nombre_prioridad`) VALUES ('3', 'Alta');
INSERT INTO `prioridades` (`id_prioridad`, `nombre_prioridad`) VALUES ('1', 'Baja');
INSERT INTO `prioridades` (`id_prioridad`, `nombre_prioridad`) VALUES ('5', 'Crítica');
INSERT INTO `prioridades` (`id_prioridad`, `nombre_prioridad`) VALUES ('2', 'Media');
INSERT INTO `prioridades` (`id_prioridad`, `nombre_prioridad`) VALUES ('4', 'Urgente');

DROP TABLE IF EXISTS `reportes`;
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

DROP TABLE IF EXISTS `resenas`;
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

DROP TABLE IF EXISTS `respuestas_comentarios`;
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

INSERT INTO `respuestas_comentarios` (`id_respuesta`, `id_comentario`, `id_usuario_respondedor`, `texto_respuesta`, `fecha_respuesta`) VALUES ('1', '1', '4', 'Gracias por su retroalimentación, nos alegra saberlo.', '2026-04-27 09:32:26');
INSERT INTO `respuestas_comentarios` (`id_respuesta`, `id_comentario`, `id_usuario_respondedor`, `texto_respuesta`, `fecha_respuesta`) VALUES ('2', '2', '2', 'El técnico asignado es Luis Martínez. Le contactará pronto.', '2026-04-27 09:32:26');
INSERT INTO `respuestas_comentarios` (`id_respuesta`, `id_comentario`, `id_usuario_respondedor`, `texto_respuesta`, `fecha_respuesta`) VALUES ('3', '3', '4', 'Haremos lo posible para finalizar hoy. Le notificaremos.', '2026-04-27 09:32:26');
INSERT INTO `respuestas_comentarios` (`id_respuesta`, `id_comentario`, `id_usuario_respondedor`, `texto_respuesta`, `fecha_respuesta`) VALUES ('4', '4', '4', 'Revisaremos el sistema de recordatorios, disculpe la molestia.', '2026-04-27 09:32:26');
INSERT INTO `respuestas_comentarios` (`id_respuesta`, `id_comentario`, `id_usuario_respondedor`, `texto_respuesta`, `fecha_respuesta`) VALUES ('5', '5', '2', '¡A usted por confiar en nuestros servicios!', '2026-04-27 09:32:26');

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES ('1', 'Administrador');
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES ('3', 'Cliente');
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES ('4', 'Soporte');
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES ('2', 'Técnico');
INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES ('5', 'Visitante');

DROP TABLE IF EXISTS `solicitudes_servicio`;
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('1', '1', 'EQ001-A', '1', 'El portátil está lento, requiere limpieza de hardware.', '3', '2026-04-27 09:32:26', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('2', '3', 'EQ003-P', '4', 'Pantalla rota tras una caída. Necesita reparación urgente.', '4', '2026-04-27 09:32:26', '3');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('3', '1', 'EQ002-B', '2', 'Deseo cambiar de Windows 11 a Linux Ubuntu.', '2', '2026-04-27 09:32:26', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('4', '5', 'EQ004-M', '5', 'El touch del tablet a veces no responde.', '1', '2026-04-27 09:32:26', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('5', '1', 'EQ005-A', '3', 'La impresora no se conecta a la red Wi-Fi.', '3', '2026-04-27 09:32:26', '3');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('6', '8', NULL, '5', 'Solicitud de prueba fase servicios', '3', '2026-06-03 03:11:17', '4');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('7', '8', NULL, NULL, 'Solicitud para cancelar fase servicios', '1', '2026-06-03 03:11:17', '5');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('8', '8', NULL, NULL, 'Solicitud fase 3B asignacion tecnico', '2', '2026-06-03 03:31:22', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('9', '9', NULL, NULL, 'dfghjkv', '2', '2026-06-04 04:38:19', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('10', '8', NULL, NULL, 'Solicitud evento notificacion fase 3D', '2', '2026-06-04 04:49:11', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('11', '8', NULL, NULL, 'Solicitud evento services notificacion corregida', '2', '2026-06-04 04:50:33', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('12', '8', NULL, NULL, 'Prueba pago manual admin 2026-06-04T04:55:29.258Z', '2', '2026-06-04 04:55:29', '2');
INSERT INTO `solicitudes_servicio` (`id_solicitud_servicio`, `id_usuario`, `id_equipo`, `id_tipo_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES ('13', '9', NULL, NULL, 'hola', '2', '2026-06-04 05:00:55', '2');

DROP TABLE IF EXISTS `tipos_documento`;
CREATE TABLE `tipos_documento` (
  `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_tipo_documento` varchar(50) DEFAULT NULL,
  `abreviatura_tipo_documento` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_documento`),
  UNIQUE KEY `nombre_tipo` (`nombre_tipo_documento`),
  UNIQUE KEY `tipo_abreviado` (`abreviatura_tipo_documento`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tipos_documento` (`id_tipo_documento`, `nombre_tipo_documento`, `abreviatura_tipo_documento`) VALUES ('1', 'Cédula de Ciudadanía', 'CC');
INSERT INTO `tipos_documento` (`id_tipo_documento`, `nombre_tipo_documento`, `abreviatura_tipo_documento`) VALUES ('2', 'Tarjeta de Identidad', 'TI');
INSERT INTO `tipos_documento` (`id_tipo_documento`, `nombre_tipo_documento`, `abreviatura_tipo_documento`) VALUES ('3', 'Cédula de Extranjería', 'CE');
INSERT INTO `tipos_documento` (`id_tipo_documento`, `nombre_tipo_documento`, `abreviatura_tipo_documento`) VALUES ('4', 'Pasaporte', 'PAS');
INSERT INTO `tipos_documento` (`id_tipo_documento`, `nombre_tipo_documento`, `abreviatura_tipo_documento`) VALUES ('5', 'Documento de Identidad', 'DNI');

DROP TABLE IF EXISTS `tipos_notificacion`;
CREATE TABLE `tipos_notificacion` (
  `id_tipo_notificacion` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_tipo_notificacion` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_notificacion`),
  UNIQUE KEY `nombre_tipo` (`nombre_tipo_notificacion`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tipos_notificacion` (`id_tipo_notificacion`, `nombre_tipo_notificacion`) VALUES ('2', 'Cita Confirmada');
INSERT INTO `tipos_notificacion` (`id_tipo_notificacion`, `nombre_tipo_notificacion`) VALUES ('5', 'Comentario Nuevo');
INSERT INTO `tipos_notificacion` (`id_tipo_notificacion`, `nombre_tipo_notificacion`) VALUES ('3', 'Pago Recibido');
INSERT INTO `tipos_notificacion` (`id_tipo_notificacion`, `nombre_tipo_notificacion`) VALUES ('4', 'Recordatorio de Cita');
INSERT INTO `tipos_notificacion` (`id_tipo_notificacion`, `nombre_tipo_notificacion`) VALUES ('1', 'Solicitud Creada');

DROP TABLE IF EXISTS `tipos_servicio`;
CREATE TABLE `tipos_servicio` (
  `id_tipo_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_servicio` varchar(150) DEFAULT NULL,
  `descripcion_servicio` varchar(225) DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id_tipo_servicio`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tipos_servicio` (`id_tipo_servicio`, `nombre_servicio`, `descripcion_servicio`, `costo`) VALUES ('1', 'Mantenimiento Preventivo PC', 'Limpieza interna, optimización de software.', '45.00');
INSERT INTO `tipos_servicio` (`id_tipo_servicio`, `nombre_servicio`, `descripcion_servicio`, `costo`) VALUES ('2', 'Instalación de SO', 'Formateo e instalación de Windows/Linux.', '75.00');
INSERT INTO `tipos_servicio` (`id_tipo_servicio`, `nombre_servicio`, `descripcion_servicio`, `costo`) VALUES ('3', 'Revisión de Red Doméstica', 'Diagnóstico y configuración de router/Wi-Fi.', '50.00');
INSERT INTO `tipos_servicio` (`id_tipo_servicio`, `nombre_servicio`, `descripcion_servicio`, `costo`) VALUES ('4', 'Reparación de Pantalla Móvil', 'Reemplazo de pantalla en smartphone o tablet.', '120.00');
INSERT INTO `tipos_servicio` (`id_tipo_servicio`, `nombre_servicio`, `descripcion_servicio`, `costo`) VALUES ('5', 'Asistencia Remota', 'Soporte técnico por internet para problemas leves.', '30.00');

DROP TABLE IF EXISTS `ubicaciones_tecnicos`;
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

INSERT INTO `ubicaciones_tecnicos` (`id_ubicacion_tecnico`, `id_usuario`, `latitud`, `longitud`, `fecha_registro`) VALUES ('1', '2', '4.71100000', '-74.07210000', '2026-04-27 09:32:26');
INSERT INTO `ubicaciones_tecnicos` (`id_ubicacion_tecnico`, `id_usuario`, `latitud`, `longitud`, `fecha_registro`) VALUES ('2', '2', '4.71150000', '-74.07250000', '2026-04-27 09:32:26');
INSERT INTO `ubicaciones_tecnicos` (`id_ubicacion_tecnico`, `id_usuario`, `latitud`, `longitud`, `fecha_registro`) VALUES ('3', '2', '4.60980000', '-74.08170000', '2026-04-27 09:32:26');
INSERT INTO `ubicaciones_tecnicos` (`id_ubicacion_tecnico`, `id_usuario`, `latitud`, `longitud`, `fecha_registro`) VALUES ('4', '2', '4.62890000', '-74.06380000', '2026-04-27 09:32:26');
INSERT INTO `ubicaciones_tecnicos` (`id_ubicacion_tecnico`, `id_usuario`, `latitud`, `longitud`, `fecha_registro`) VALUES ('5', '2', '4.69000000', '-74.07500000', '2026-04-27 09:32:26');

DROP TABLE IF EXISTS `usuarios`;
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

INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('1', '1', 'Ana', 'García', 'ana.garcia@email.com', 'claveAna', '3001234567', 'Calle 10 # 1-1A', NULL, '2026-04-27 09:32:25', '3', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('2', '1', 'Luis', 'Martínez', 'luis.martinez@email.com', 'claveLuis', '3017654321', 'Avenida 5 # 2B-2C', '3', '2026-04-27 09:32:25', '2', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('3', '4', 'Pedro', 'López', 'pedro.lopez@email.com', 'clavePedro', '3025556677', 'Carrera 8 # 3-3D', NULL, '2026-04-27 09:32:25', '3', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('4', '1', 'Sofía', 'Rodríguez', 'sofia.rodri@email.com', 'claveSofia', '3034445588', 'Transversal 12 # 4-4E', '1', '2026-04-27 09:32:25', '1', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('5', '3', 'María', 'Fernández', 'maria.f@email.com', 'claveMaria', '3049991122', 'Diagonal 15 # 5F-6G', NULL, '2026-04-27 09:32:25', '3', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('6', NULL, 'Admin', 'FuturApp', 'admin@futurapp.com', '$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK', '3000000000', NULL, NULL, '2026-06-03 02:59:26', '1', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('7', NULL, 'Tecnico', 'FuturApp', 'tecnico@futurapp.com', '$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK', '3100000000', NULL, NULL, '2026-06-03 02:59:26', '2', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('8', NULL, 'Usuario', 'FuturApp', 'usuario@futurapp.com', '$2b$10$uxFL6UG43Gkn/Y/452mxIece0RP/Q.UlLqnmQIysI/Bx2e68kIBLK', '3200000000', NULL, NULL, '2026-06-03 02:59:26', '3', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('9', NULL, 'Desarrollo', 'IA', 'desarrolloia616@gmail.com', '$2b$10$g7ztfFOlZtiRoJ/cPbNtHeiqD0sprjlB2G9UPDebUb27S.CiauAyS', NULL, NULL, NULL, '2026-06-04 04:37:57', '3', '1');
INSERT INTO `usuarios` (`id_usuario`, `id_tipo_documento`, `nombre`, `apellido`, `correo`, `contrasena_hash`, `telefono`, `direccion`, `id_area_especialidad`, `fecha_registro`, `id_rol`, `activo`) VALUES ('10', NULL, 'Desarrolloadmin', 'IA', 'este@11.com', '$2b$10$9Mgm3wALr8fv7HPmw4zMZOn4P9lZrDy6xO0HSwzh52Oh9nltAZTb6', NULL, NULL, NULL, '2026-06-04 04:39:24', '1', '1');

DROP TABLE IF EXISTS `_prisma_migrations`;
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

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES ('1da9c81a-c4ce-4bcc-a53e-14e4320eb4a4', 'cb329b015b39ce30c30e077d619c77ecfd82161ac2ec2c3e5fd70c19b975f705', '2026-06-02 21:48:15.264', '20260602214815_add_profile_fields', NULL, NULL, '2026-06-02 21:48:15.235', '1');
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES ('9d44370c-e73e-4a85-9bcb-0a346f1a33de', '0a0ffaef18fe0995276aea9071813aa61538cb1abc9f38b41f72147e7dcbf6d7', '2026-06-02 21:18:48.124', '20260602211700_unique_appointment_service', '', NULL, '2026-06-02 21:18:48.124', '0');
INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES ('c1314fff-1115-488f-8507-32307e861ffe', 'ae951f03a77a62bae0369b3e1ab9171cfc179445d38c0db8525114afb86784d6', '2026-06-02 20:32:27.841', '20260602203226_init', NULL, NULL, '2026-06-02 20:32:26.821', '1');

SET FOREIGN_KEY_CHECKS=1;
