CREATE TABLE IF NOT EXISTS recuperaciones_contrasena (
  id_recuperacion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  fecha_expiracion DATETIME NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_uso DATETIME NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_recuperaciones_usuario (id_usuario),
  INDEX idx_recuperaciones_token_hash (token_hash),

  CONSTRAINT fk_recuperaciones_usuario
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
