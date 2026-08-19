-- FuturApp - Limpieza final de tablas no funcionales
-- Fecha: 2026-06-04
-- Ejecutado sobre la base oficial futurapp el 2026-06-04.
-- Mantener este archivo como registro revisable de la limpieza aplicada.
--
-- Requisitos antes de ejecutar:
-- 1. Confirmar backup existente y restaurable:
--    database/backups/futurapp_before_cleanup_final.sql
-- 2. Confirmar que schema.prisma ya no contiene model Empleado ni relaciones hacia empleados.
-- 3. Confirmar que el backend no usa prisma.empleado, empleados ni legacy_*.
-- 4. Confirmar que comments.service.js usa prisma.comentario.
-- 5. Confirmar que locations.service.js usa prisma.ubicacionTecnico.
-- 6. Confirmar que asesorias.id_empleado no contiene dependencias funcionales.

-- Validaciones previas de solo lectura:
SELECT COUNT(*) AS empleados_total
FROM empleados;

SELECT COUNT(*) AS asesorias_con_empleado
FROM asesorias
WHERE id_empleado IS NOT NULL;

SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'legacy\_%'
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND (TABLE_NAME = 'empleados'
    OR REFERENCED_TABLE_NAME = 'empleados'
    OR TABLE_NAME LIKE 'legacy\_%'
    OR REFERENCED_TABLE_NAME LIKE 'legacy\_%')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;

-- Ejecutar el bloque destructivo solo si:
-- - asesorias_con_empleado = 0
-- - el backup fue validado
-- - Prisma y backend ya fueron alineados con el modelo final
--
-- Nota: MySQL hace autocommit implicito en DDL. No se envuelve en transaccion
-- porque ALTER TABLE y DROP TABLE no son reversibles con ROLLBACK.

-- Retira la dependencia funcional vacia hacia empleados.
ALTER TABLE `asesorias`
  DROP FOREIGN KEY `fk_asesorias_empleado`;

ALTER TABLE `asesorias`
  DROP INDEX `id`;

ALTER TABLE `asesorias`
  DROP COLUMN `id_empleado`;

-- Las tablas legacy tienen FKs entre ellas; se eliminan como bloque controlado.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `legacy_payments_20260602_215008`;
DROP TABLE IF EXISTS `legacy_appointments_20260602_215008`;
DROP TABLE IF EXISTS `legacy_comments_20260602_215008`;
DROP TABLE IF EXISTS `legacy_notifications_20260602_215008`;
DROP TABLE IF EXISTS `legacy_technician_locations_20260602_215008`;
DROP TABLE IF EXISTS `legacy_services_20260602_215008`;
DROP TABLE IF EXISTS `legacy_users_20260602_215008`;
DROP TABLE IF EXISTS `legacy_roles_20260602_215008`;

DROP TABLE IF EXISTS `empleados`;

SET FOREIGN_KEY_CHECKS = 1;

-- Validacion posterior:
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND (TABLE_NAME = 'empleados' OR TABLE_NAME LIKE 'legacy\_%')
ORDER BY TABLE_NAME;
