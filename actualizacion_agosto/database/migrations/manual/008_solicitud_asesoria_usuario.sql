-- FuturApp - Solicitud de asesoria desde rol usuario
-- Migracion manual no destructiva.
-- Requiere backup previo de la base futurapp.

ALTER TABLE asesorias
  MODIFY COLUMN descripcion VARCHAR(2000) NULL,
  ADD COLUMN IF NOT EXISTS tipo_dispositivo VARCHAR(30) NULL AFTER descripcion,
  ADD COLUMN IF NOT EXISTS telefono_principal VARCHAR(15) NULL AFTER tipo_dispositivo,
  ADD COLUMN IF NOT EXISTS telefono_alterno VARCHAR(15) NULL AFTER telefono_principal,
  ADD COLUMN IF NOT EXISTS id_tipo_servicio INT NULL AFTER telefono_alterno,
  ADD COLUMN IF NOT EXISTS descripcion_servicio_final VARCHAR(1000) NULL AFTER id_tipo_servicio,
  ADD COLUMN IF NOT EXISTS fecha_actualizacion DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER fecha_creacion;

SET @idx_tipo_servicio_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'asesorias'
    AND index_name = 'idx_asesorias_tipo_servicio'
);
SET @sql := IF(
  @idx_tipo_servicio_exists = 0,
  'ALTER TABLE asesorias ADD INDEX idx_asesorias_tipo_servicio (id_tipo_servicio)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_tipo_servicio_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'asesorias'
    AND constraint_name = 'fk_asesorias_tipo_servicio'
);
SET @sql := IF(
  @fk_tipo_servicio_exists = 0,
  'ALTER TABLE asesorias ADD CONSTRAINT fk_asesorias_tipo_servicio FOREIGN KEY (id_tipo_servicio) REFERENCES tipos_servicio(id_tipo_servicio) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
