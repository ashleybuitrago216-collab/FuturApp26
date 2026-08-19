-- FuturApp - Geolocalizacion de servicios (Fase 1)
-- Objetivo:
-- 1. Guardar la ubicacion del servicio seleccionada por el usuario.
-- 2. Asociar el historial de ubicaciones del tecnico a una solicitud de servicio.
-- 3. Mantener compatibilidad con ubicaciones_tecnicos existente.

CREATE TABLE `ubicaciones_servicios` (
  `id_ubicacion_servicio` int(11) NOT NULL AUTO_INCREMENT,
  `id_solicitud_servicio` int(11) NOT NULL,
  `latitud` decimal(10,8) NOT NULL,
  `longitud` decimal(11,8) NOT NULL,
  `direccion_referencia` varchar(255) DEFAULT NULL,
  `fuente` varchar(30) NOT NULL DEFAULT 'manual',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_ubicacion_servicio`),
  UNIQUE KEY `uq_ubicaciones_servicios_solicitud` (`id_solicitud_servicio`),
  KEY `idx_ubicaciones_servicios_solicitud` (`id_solicitud_servicio`),
  CONSTRAINT `fk_ubicaciones_servicios_solicitud`
    FOREIGN KEY (`id_solicitud_servicio`)
    REFERENCES `solicitudes_servicio` (`id_solicitud_servicio`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `ubicaciones_tecnicos`
  ADD COLUMN `id_solicitud_servicio` int(11) DEFAULT NULL AFTER `id_usuario`,
  ADD COLUMN `precision_metros` decimal(8,2) DEFAULT NULL AFTER `longitud`,
  ADD COLUMN `fuente` varchar(30) NOT NULL DEFAULT 'gps' AFTER `precision_metros`;

ALTER TABLE `ubicaciones_tecnicos`
  ADD KEY `idx_ubicaciones_tecnicos_solicitud_fecha` (`id_solicitud_servicio`, `fecha_registro`),
  ADD CONSTRAINT `fk_ubicaciones_tecnicos_solicitud`
    FOREIGN KEY (`id_solicitud_servicio`)
    REFERENCES `solicitudes_servicio` (`id_solicitud_servicio`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
