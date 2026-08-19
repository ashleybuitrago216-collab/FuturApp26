-- FuturApp - Normalizacion manual de nombres a espanol
-- Fase 1: archivo revisable, NO ejecutado por Codex.
-- Origen: futurapp (1).sql exportado desde phpMyAdmin / MariaDB 10.4.32.
--
-- Objetivo:
-- - Renombrar tablas y columnas con abreviaturas o nombres poco claros.
-- - Preservar datos, llaves primarias, llaves foraneas e indices.
-- - Mantener las entidades originales del dump.
--
-- Antes de ejecutar en una base real:
-- 1. Hacer backup completo de la base futurapp.
-- 2. Confirmar que las tablas actuales coinciden con el dump original.
-- 3. Revisar que no existan tablas nuevas con los nombres destino.
-- 4. Ejecutar primero en una base clonada.

-- Nota sobre empleados.fecha_contratacion:
-- El dump original contiene al menos un valor '0000-00-00'. Este SQL no lo modifica
-- para preservar datos. Antes de consultar ese campo con Prisma, se recomienda una
-- decision funcional explicita: convertirlo a NULL o a una fecha real en un script
-- separado y aprobado.

START TRANSACTION;
SET FOREIGN_KEY_CHECKS = 0;

-- Constraints detectadas que dependen de columnas/tablas a renombrar.
ALTER TABLE `asesoria` DROP FOREIGN KEY `asesoria_ibfk_1`;
ALTER TABLE `asesoria` DROP FOREIGN KEY `asesoria_ibfk_2`;
ALTER TABLE `asesoria` DROP FOREIGN KEY `asesoria_ibfk_3`;
ALTER TABLE `asesoria` DROP FOREIGN KEY `asesoria_ibfk_4`;
ALTER TABLE `asesoria` DROP FOREIGN KEY `asesoria_ibfk_5`;
ALTER TABLE `citas` DROP FOREIGN KEY `citas_ibfk_1`;
ALTER TABLE `citas` DROP FOREIGN KEY `citas_ibfk_2`;
ALTER TABLE `citas` DROP FOREIGN KEY `citas_ibfk_3`;
ALTER TABLE `comentarios` DROP FOREIGN KEY `comentarios_ibfk_1`;
ALTER TABLE `comentarios` DROP FOREIGN KEY `usrs_fk`;
ALTER TABLE `empleados` DROP FOREIGN KEY `empleados_area`;
ALTER TABLE `equipos` DROP FOREIGN KEY `equipos_ibfk_1`;
ALTER TABLE `equipos` DROP FOREIGN KEY `equipos_ibfk_2`;
ALTER TABLE `notificaciones` DROP FOREIGN KEY `notificaciones_ibfk_1`;
ALTER TABLE `notificaciones` DROP FOREIGN KEY `notificaciones_ibfk_2`;
ALTER TABLE `pagos` DROP FOREIGN KEY `pagos_ibfk_1`;
ALTER TABLE `pagos` DROP FOREIGN KEY `pagos_ibfk_2`;
ALTER TABLE `pagos` DROP FOREIGN KEY `pagos_ibfk_3`;
ALTER TABLE `pagos` DROP FOREIGN KEY `pagos_ibfk_4`;
ALTER TABLE `reportes` DROP FOREIGN KEY `fk_reporte_usuario`;
ALTER TABLE `resenas` DROP FOREIGN KEY `fk_resena_asesoria`;
ALTER TABLE `resenas` DROP FOREIGN KEY `fk_resena_solicitud`;
ALTER TABLE `resenas` DROP FOREIGN KEY `fk_resena_usuario`;
ALTER TABLE `respuestas_comentarios` DROP FOREIGN KEY `respuestas_comentarios_ibfk_1`;
ALTER TABLE `respuestas_comentarios` DROP FOREIGN KEY `respuestas_comentarios_ibfk_2`;
ALTER TABLE `solicitudes_servicio` DROP FOREIGN KEY `solicitudes_servicio_ibfk_1`;
ALTER TABLE `solicitudes_servicio` DROP FOREIGN KEY `solicitudes_servicio_ibfk_2`;
ALTER TABLE `solicitudes_servicio` DROP FOREIGN KEY `solicitudes_servicio_ibfk_3`;
ALTER TABLE `solicitudes_servicio` DROP FOREIGN KEY `solicitudes_servicio_ibfk_4`;
ALTER TABLE `solicitudes_servicio` DROP FOREIGN KEY `solicitudes_servicio_ibfk_5`;
ALTER TABLE `ubicaciones_tecnicos` DROP FOREIGN KEY `ubicaciones_tecnicos_ibfk_1`;
ALTER TABLE `usrs` DROP FOREIGN KEY `usrs_ibfk_1`;
ALTER TABLE `usrs` DROP FOREIGN KEY `usrs_ibfk_2`;
ALTER TABLE `usrs` DROP FOREIGN KEY `usrs_ibfk_3`;

-- Renombrado de tablas.
RENAME TABLE
  `asesoria` TO `asesorias`,
  `estado_pago` TO `estados_pago`,
  `tp_servicios` TO `tipos_servicio`,
  `usrs` TO `usuarios`;

-- Renombrado de columnas de catalogos y entidades principales.
ALTER TABLE `areas_especialidad` CHANGE COLUMN `id_area` `id_area_especialidad` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `areas_especialidad` CHANGE COLUMN `nombre_area` `nombre_area_especialidad` varchar(50) DEFAULT NULL;

ALTER TABLE `asesorias` CHANGE COLUMN `id_asesora` `id_asesoria` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `asesorias` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;
ALTER TABLE `asesorias` CHANGE COLUMN `id_area` `id_area_especialidad` int(11) DEFAULT NULL;
ALTER TABLE `asesorias` CHANGE COLUMN `id` `id_empleado` int(11) DEFAULT NULL;
ALTER TABLE `asesorias` CHANGE COLUMN `decripcion_problema` `descripcion_problema` varchar(500) DEFAULT NULL;
ALTER TABLE `asesorias` CHANGE COLUMN `comentarios` `comentario` varchar(200) DEFAULT NULL;

ALTER TABLE `citas` CHANGE COLUMN `id_solicitud` `id_solicitud_servicio` int(11) DEFAULT NULL;
ALTER TABLE `citas` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;

ALTER TABLE `comentarios` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;

ALTER TABLE `empleados` CHANGE COLUMN `id` `id_empleado` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `empleados` CHANGE COLUMN `id_area` `id_area_especialidad` int(11) DEFAULT NULL;

ALTER TABLE `equipos` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;

ALTER TABLE `estados_pago` CHANGE COLUMN `id_estado` `id_estado_pago` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `estados_pago` CHANGE COLUMN `nombre_estado` `nombre_estado_pago` varchar(30) NOT NULL;

ALTER TABLE `medios_pago` CHANGE COLUMN `id_medio` `id_medio_pago` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `medios_pago` CHANGE COLUMN `nombre_medio` `nombre_medio_pago` varchar(50) DEFAULT NULL;

ALTER TABLE `notificaciones` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;
ALTER TABLE `notificaciones` CHANGE COLUMN `id_tipo_notif` `id_tipo_notificacion` int(11) DEFAULT NULL;

ALTER TABLE `pagos` CHANGE COLUMN `id_medio` `id_medio_pago` int(11) DEFAULT NULL;
ALTER TABLE `pagos` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;

ALTER TABLE `reportes` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;

ALTER TABLE `resenas` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;
ALTER TABLE `resenas` CHANGE COLUMN `id_asesora` `id_asesoria` int(11) DEFAULT NULL;
ALTER TABLE `resenas` CHANGE COLUMN `id_solicitud` `id_solicitud_servicio` int(11) DEFAULT NULL;

ALTER TABLE `respuestas_comentarios` CHANGE COLUMN `id_respondedor` `id_usuario_respondedor` int(11) DEFAULT NULL;

ALTER TABLE `solicitudes_servicio` CHANGE COLUMN `id_solicitud` `id_solicitud_servicio` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `solicitudes_servicio` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;
ALTER TABLE `solicitudes_servicio` CHANGE COLUMN `id_tp_servicio` `id_tipo_servicio` int(11) DEFAULT NULL;

ALTER TABLE `tipos_documento` CHANGE COLUMN `id_tipo_doc` `id_tipo_documento` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tipos_documento` CHANGE COLUMN `nombre_tipo` `nombre_tipo_documento` varchar(50) DEFAULT NULL;
ALTER TABLE `tipos_documento` CHANGE COLUMN `tipo_abreviado` `abreviatura_tipo_documento` varchar(10) DEFAULT NULL;

ALTER TABLE `tipos_notificacion` CHANGE COLUMN `id_tipo_notif` `id_tipo_notificacion` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tipos_notificacion` CHANGE COLUMN `nombre_tipo` `nombre_tipo_notificacion` varchar(50) DEFAULT NULL;

ALTER TABLE `tipos_servicio` CHANGE COLUMN `id_tp_servicio` `id_tipo_servicio` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tipos_servicio` CHANGE COLUMN `desc_servicio` `descripcion_servicio` varchar(225) DEFAULT NULL;

ALTER TABLE `ubicaciones_tecnicos` CHANGE COLUMN `id_ubicacion` `id_ubicacion_tecnico` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `ubicaciones_tecnicos` CHANGE COLUMN `id_usrs` `id_usuario` int(11) DEFAULT NULL;

ALTER TABLE `usuarios` CHANGE COLUMN `id_usrs` `id_usuario` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `usuarios` CHANGE COLUMN `id_tp_doc` `id_tipo_documento` int(11) DEFAULT NULL;
ALTER TABLE `usuarios` CHANGE COLUMN `clave` `contrasena_hash` varchar(255) DEFAULT NULL;
ALTER TABLE `usuarios` CHANGE COLUMN `id_area` `id_area_especialidad` int(11) DEFAULT NULL;

-- Limpieza recomendada de nombres de indices. En MariaDB 10.4 de XAMPP el renombrado de indices puede no estar disponible.
-- Se omite en la ejecucion para preservar compatibilidad; los indices se conservan
-- automaticamente sobre las columnas renombradas y las FKs se recrean con nombres claros.
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `areas_especialidad` RENAME KEY `nombre_area` TO `uq_areas_especialidad_nombre`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `asesorias` RENAME KEY `id_usrs` TO `idx_asesorias_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `asesorias` RENAME KEY `id_area` TO `idx_asesorias_id_area_especialidad`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `asesorias` RENAME KEY `id` TO `idx_asesorias_id_empleado`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `citas` RENAME KEY `id_solicitud` TO `idx_citas_id_solicitud_servicio`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `citas` RENAME KEY `id_usrs` TO `idx_citas_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `comentarios` RENAME KEY `usrs_fk` TO `idx_comentarios_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `empleados` RENAME KEY `empleados_area` TO `idx_empleados_id_area_especialidad`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `equipos` RENAME KEY `id_usrs` TO `idx_equipos_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `medios_pago` RENAME KEY `nombre_medio` TO `uq_medios_pago_nombre`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `notificaciones` RENAME KEY `id_usrs` TO `idx_notificaciones_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `notificaciones` RENAME KEY `id_tipo_notif` TO `idx_notificaciones_id_tipo_notificacion`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `pagos` RENAME KEY `id_medio` TO `idx_pagos_id_medio_pago`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `pagos` RENAME KEY `id_usrs` TO `idx_pagos_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `prioridades` RENAME KEY `nombre_prioridad` TO `uq_prioridades_nombre`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `reportes` RENAME KEY `fk_reporte_usuario` TO `idx_reportes_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `resenas` RENAME KEY `fk_resena_usuario` TO `idx_resenas_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `resenas` RENAME KEY `fk_resena_asesoria` TO `idx_resenas_id_asesoria`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `resenas` RENAME KEY `fk_resena_solicitud` TO `idx_resenas_id_solicitud_servicio`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `respuestas_comentarios` RENAME KEY `id_respondedor` TO `idx_respuestas_comentarios_id_usuario_respondedor`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `roles` RENAME KEY `nombre_rol` TO `uq_roles_nombre`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `solicitudes_servicio` RENAME KEY `id_usrs` TO `idx_solicitudes_servicio_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `solicitudes_servicio` RENAME KEY `id_tp_servicio` TO `idx_solicitudes_servicio_id_tipo_servicio`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `tipos_documento` RENAME KEY `nombre_tipo` TO `uq_tipos_documento_nombre`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `tipos_documento` RENAME KEY `tipo_abreviado` TO `uq_tipos_documento_abreviatura`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `tipos_notificacion` RENAME KEY `nombre_tipo` TO `uq_tipos_notificacion_nombre`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `ubicaciones_tecnicos` RENAME KEY `id_usrs` TO `idx_ubicaciones_tecnicos_id_usuario`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `usuarios` RENAME KEY `id_tp_doc` TO `idx_usuarios_id_tipo_documento`;
-- Omitido por compatibilidad MariaDB 10.4: ALTER TABLE `usuarios` RENAME KEY `id_area` TO `idx_usuarios_id_area_especialidad`;

-- Recreacion de llaves foraneas con nombres normalizados.
ALTER TABLE `asesorias`
  ADD CONSTRAINT `fk_asesorias_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_asesorias_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`),
  ADD CONSTRAINT `fk_asesorias_empleado` FOREIGN KEY (`id_empleado`) REFERENCES `empleados` (`id_empleado`),
  ADD CONSTRAINT `fk_asesorias_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  ADD CONSTRAINT `fk_asesorias_notificacion` FOREIGN KEY (`id_notificacion`) REFERENCES `notificaciones` (`id_notificacion`);

ALTER TABLE `citas`
  ADD CONSTRAINT `fk_citas_solicitud_servicio` FOREIGN KEY (`id_solicitud_servicio`) REFERENCES `solicitudes_servicio` (`id_solicitud_servicio`),
  ADD CONSTRAINT `fk_citas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_citas_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`);

ALTER TABLE `comentarios`
  ADD CONSTRAINT `fk_comentarios_cita` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`),
  ADD CONSTRAINT `fk_comentarios_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

ALTER TABLE `empleados`
  ADD CONSTRAINT `fk_empleados_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `equipos`
  ADD CONSTRAINT `fk_equipos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_equipos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`);

ALTER TABLE `notificaciones`
  ADD CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_notificaciones_tipo_notificacion` FOREIGN KEY (`id_tipo_notificacion`) REFERENCES `tipos_notificacion` (`id_tipo_notificacion`);

ALTER TABLE `pagos`
  ADD CONSTRAINT `fk_pagos_cita` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`),
  ADD CONSTRAINT `fk_pagos_medio_pago` FOREIGN KEY (`id_medio_pago`) REFERENCES `medios_pago` (`id_medio_pago`),
  ADD CONSTRAINT `fk_pagos_estado_pago` FOREIGN KEY (`id_estado_pago`) REFERENCES `estados_pago` (`id_estado_pago`),
  ADD CONSTRAINT `fk_pagos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

ALTER TABLE `reportes`
  ADD CONSTRAINT `fk_reportes_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

ALTER TABLE `resenas`
  ADD CONSTRAINT `fk_resenas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_resenas_asesoria` FOREIGN KEY (`id_asesoria`) REFERENCES `asesorias` (`id_asesoria`),
  ADD CONSTRAINT `fk_resenas_solicitud_servicio` FOREIGN KEY (`id_solicitud_servicio`) REFERENCES `solicitudes_servicio` (`id_solicitud_servicio`);

ALTER TABLE `respuestas_comentarios`
  ADD CONSTRAINT `fk_respuestas_comentarios_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  ADD CONSTRAINT `fk_respuestas_comentarios_usuario_respondedor` FOREIGN KEY (`id_usuario_respondedor`) REFERENCES `usuarios` (`id_usuario`);

ALTER TABLE `solicitudes_servicio`
  ADD CONSTRAINT `fk_solicitudes_servicio_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_solicitudes_servicio_equipo` FOREIGN KEY (`id_equipo`) REFERENCES `equipos` (`id_equipo`),
  ADD CONSTRAINT `fk_solicitudes_servicio_tipo_servicio` FOREIGN KEY (`id_tipo_servicio`) REFERENCES `tipos_servicio` (`id_tipo_servicio`),
  ADD CONSTRAINT `fk_solicitudes_servicio_prioridad` FOREIGN KEY (`id_prioridad`) REFERENCES `prioridades` (`id_prioridad`),
  ADD CONSTRAINT `fk_solicitudes_servicio_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`);

ALTER TABLE `ubicaciones_tecnicos`
  ADD CONSTRAINT `fk_ubicaciones_tecnicos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_tipo_documento` FOREIGN KEY (`id_tipo_documento`) REFERENCES `tipos_documento` (`id_tipo_documento`),
  ADD CONSTRAINT `fk_usuarios_area_especialidad` FOREIGN KEY (`id_area_especialidad`) REFERENCES `areas_especialidad` (`id_area_especialidad`),
  ADD CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- Fallback para versiones sin RENAME COLUMN:
-- Usar ALTER TABLE ... CHANGE COLUMN nombre_actual nombre_nuevo TIPO_EXACTO ...
-- conservando exactamente tipo, nulabilidad, default y AUTO_INCREMENT del dump.

