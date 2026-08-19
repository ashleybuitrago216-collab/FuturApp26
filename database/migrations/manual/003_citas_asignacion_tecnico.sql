-- FuturApp - Fase 3B: formalizacion de cliente y tecnico en citas
-- Archivo manual revisable. No usar prisma migrate para este cambio.
--
-- Objetivo:
-- - Separar cliente y tecnico en la tabla citas.
-- - Preservar datos existentes.
-- - Mantener una cita por solicitud de servicio para evitar duplicados.
-- - Permitir que Services asigne tecnico creando/actualizando la cita asociada.
--
-- Nota de estado:
-- En la base futurapp revisada durante Fase 3B, estas columnas/constraints ya
-- existen. Este SQL queda como referencia para bases que aun tengan la estructura
-- anterior con solo id_usuario.

START TRANSACTION;

ALTER TABLE `citas`
  ADD COLUMN IF NOT EXISTS `id_usuario_cliente` int(11) DEFAULT NULL AFTER `id_solicitud_servicio`,
  ADD COLUMN IF NOT EXISTS `id_usuario_tecnico` int(11) DEFAULT NULL AFTER `id_usuario_cliente`;

-- Poblar cliente desde solicitudes_servicio cuando exista relacion.
UPDATE `citas` c
LEFT JOIN `solicitudes_servicio` s
  ON s.`id_solicitud_servicio` = c.`id_solicitud_servicio`
SET c.`id_usuario_cliente` = COALESCE(c.`id_usuario_cliente`, s.`id_usuario`, c.`id_usuario`)
WHERE c.`id_usuario_cliente` IS NULL;

-- Indices auxiliares. Si ya existen, MariaDB puede emitir warning y continuar.
ALTER TABLE `citas`
  ADD INDEX IF NOT EXISTS `idx_citas_id_usuario_cliente` (`id_usuario_cliente`),
  ADD INDEX IF NOT EXISTS `idx_citas_id_usuario_tecnico` (`id_usuario_tecnico`);

-- Evita duplicar citas por solicitud. Antes de aplicar en otra base, validar:
-- SELECT id_solicitud_servicio, COUNT(*)
-- FROM citas
-- WHERE id_solicitud_servicio IS NOT NULL
-- GROUP BY id_solicitud_servicio
-- HAVING COUNT(*) > 1;
ALTER TABLE `citas`
  ADD UNIQUE INDEX IF NOT EXISTS `uq_citas_id_solicitud_servicio` (`id_solicitud_servicio`);

-- Crear FKs solo si no existen en la base destino. Si MariaDB no soporta
-- ADD CONSTRAINT IF NOT EXISTS, verificar information_schema antes de ejecutar.
ALTER TABLE `citas`
  ADD CONSTRAINT `fk_citas_usuario_cliente`
    FOREIGN KEY (`id_usuario_cliente`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `fk_citas_usuario_tecnico`
    FOREIGN KEY (`id_usuario_tecnico`) REFERENCES `usuarios` (`id_usuario`);

COMMIT;

-- Reversion no destructiva sugerida:
-- ALTER TABLE citas DROP FOREIGN KEY fk_citas_usuario_cliente;
-- ALTER TABLE citas DROP FOREIGN KEY fk_citas_usuario_tecnico;
-- ALTER TABLE citas DROP INDEX idx_citas_id_usuario_cliente;
-- ALTER TABLE citas DROP INDEX idx_citas_id_usuario_tecnico;
-- ALTER TABLE citas DROP INDEX uq_citas_id_solicitud_servicio;
-- ALTER TABLE citas DROP COLUMN id_usuario_cliente;
-- ALTER TABLE citas DROP COLUMN id_usuario_tecnico;
