-- FuturApp - Modulo Ayuda contextual y base de conocimiento
-- Fase 3: evolucion segura de tabla ayudas sin borrar datos.
-- Requiere backup previo antes de aplicar.

ALTER TABLE ayudas
  ADD COLUMN IF NOT EXISTS slug VARCHAR(120) NULL AFTER id_ayuda,
  ADD COLUMN IF NOT EXISTS resumen VARCHAR(255) NULL AFTER titulo,
  ADD COLUMN IF NOT EXISTS contenido TEXT NULL AFTER descripcion,
  ADD COLUMN IF NOT EXISTS tipo_contenido VARCHAR(30) NULL DEFAULT 'guia' AFTER categoria,
  ADD COLUMN IF NOT EXISTS pantalla_contexto VARCHAR(80) NULL AFTER tipo_contenido,
  ADD COLUMN IF NOT EXISTS accion_contexto VARCHAR(80) NULL AFTER pantalla_contexto,
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(255) NULL AFTER archivo_url,
  ADD COLUMN IF NOT EXISTS orden INT NOT NULL DEFAULT 0 AFTER estado,
  ADD COLUMN IF NOT EXISTS fecha_actualizacion DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER fecha_publicacion,
  ADD COLUMN IF NOT EXISTS id_usuario_autor INT NULL AFTER fecha_actualizacion;

UPDATE ayudas
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(TRIM(titulo), ' ', '-'),
          '.', ''
        ),
        ',', ''
      ),
      '/', '-'
    ),
    '--', '-'
  )
)
WHERE slug IS NULL OR slug = '';

UPDATE ayudas
SET resumen = LEFT(descripcion, 255)
WHERE (resumen IS NULL OR resumen = '') AND descripcion IS NOT NULL;

UPDATE ayudas
SET contenido = descripcion
WHERE (contenido IS NULL OR contenido = '') AND descripcion IS NOT NULL;

CREATE TABLE IF NOT EXISTS ayudas_roles (
  id_ayuda_rol INT NOT NULL AUTO_INCREMENT,
  id_ayuda INT NOT NULL,
  rol VARCHAR(30) NOT NULL,
  PRIMARY KEY (id_ayuda_rol),
  UNIQUE KEY uq_ayudas_roles_ayuda_rol (id_ayuda, rol),
  KEY idx_ayudas_roles_rol (rol),
  CONSTRAINT fk_ayudas_roles_ayuda
    FOREIGN KEY (id_ayuda)
    REFERENCES ayudas (id_ayuda)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS ayudas_relacionadas (
  id_ayuda_relacionada INT NOT NULL AUTO_INCREMENT,
  id_ayuda INT NOT NULL,
  id_ayuda_destino INT NOT NULL,
  PRIMARY KEY (id_ayuda_relacionada),
  UNIQUE KEY uq_ayudas_relacionadas_origen_destino (id_ayuda, id_ayuda_destino),
  KEY idx_ayudas_relacionadas_destino (id_ayuda_destino),
  CONSTRAINT fk_ayudas_relacionadas_origen
    FOREIGN KEY (id_ayuda)
    REFERENCES ayudas (id_ayuda)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_ayudas_relacionadas_destino
    FOREIGN KEY (id_ayuda_destino)
    REFERENCES ayudas (id_ayuda)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO ayudas_roles (id_ayuda, rol)
SELECT id_ayuda, 'todos'
FROM ayudas;

CREATE INDEX IF NOT EXISTS idx_ayudas_slug ON ayudas (slug);
CREATE INDEX IF NOT EXISTS idx_ayudas_estado ON ayudas (estado);
CREATE INDEX IF NOT EXISTS idx_ayudas_categoria ON ayudas (categoria);
CREATE INDEX IF NOT EXISTS idx_ayudas_contexto ON ayudas (pantalla_contexto, accion_contexto);
CREATE INDEX IF NOT EXISTS idx_ayudas_autor ON ayudas (id_usuario_autor);
