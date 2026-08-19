-- FuturApp - Modulo Asesoria Fase 1
-- Migracion manual no destructiva.
-- Requisitos previos:
--   1. Crear backup de la base futurapp.
--   2. Revisar este SQL antes de aplicarlo.
-- No usa DROP, TRUNCATE ni DELETE.

INSERT INTO roles (nombre_rol)
SELECT 'Asesor'
WHERE NOT EXISTS (
  SELECT 1
  FROM roles
  WHERE LOWER(TRIM(nombre_rol)) = 'asesor'
);

ALTER TABLE asesorias
  ADD COLUMN IF NOT EXISTS id_usuario_solicitante INT NULL AFTER id_usuario,
  ADD COLUMN IF NOT EXISTS id_usuario_asesor INT NULL AFTER id_usuario_solicitante,
  ADD COLUMN IF NOT EXISTS fecha DATE NULL AFTER id_usuario_asesor,
  ADD COLUMN IF NOT EXISTS hora TIME NULL AFTER fecha,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NULL DEFAULT 'Programada' AFTER hora,
  ADD COLUMN IF NOT EXISTS motivo VARCHAR(150) NULL AFTER estado,
  ADD COLUMN IF NOT EXISTS descripcion VARCHAR(500) NULL AFTER motivo,
  ADD COLUMN IF NOT EXISTS fecha_creacion DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER descripcion;

SET @idx_solicitante_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'asesorias'
    AND index_name = 'idx_asesorias_usuario_solicitante'
);
SET @sql := IF(
  @idx_solicitante_exists = 0,
  'ALTER TABLE asesorias ADD INDEX idx_asesorias_usuario_solicitante (id_usuario_solicitante)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_asesor_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'asesorias'
    AND index_name = 'idx_asesorias_usuario_asesor'
);
SET @sql := IF(
  @idx_asesor_exists = 0,
  'ALTER TABLE asesorias ADD INDEX idx_asesorias_usuario_asesor (id_usuario_asesor)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_solicitante_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'asesorias'
    AND constraint_name = 'fk_asesorias_usuario_solicitante'
);
SET @sql := IF(
  @fk_solicitante_exists = 0,
  'ALTER TABLE asesorias ADD CONSTRAINT fk_asesorias_usuario_solicitante FOREIGN KEY (id_usuario_solicitante) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_asesor_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'asesorias'
    AND constraint_name = 'fk_asesorias_usuario_asesor'
);
SET @sql := IF(
  @fk_asesor_exists = 0,
  'ALTER TABLE asesorias ADD CONSTRAINT fk_asesorias_usuario_asesor FOREIGN KEY (id_usuario_asesor) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
