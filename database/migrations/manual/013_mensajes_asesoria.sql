CREATE TABLE IF NOT EXISTS mensajes_asesoria (
  id_mensaje_asesoria INT AUTO_INCREMENT PRIMARY KEY,
  id_asesoria INT NOT NULL,
  id_usuario_remitente INT NOT NULL,
  mensaje TEXT NOT NULL,
  fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_mensajes_asesoria_fecha (id_asesoria, fecha_envio),
  INDEX idx_mensajes_asesoria_remitente (id_usuario_remitente),

  CONSTRAINT fk_mensajes_asesoria_asesoria
    FOREIGN KEY (id_asesoria)
    REFERENCES asesorias(id_asesoria)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_mensajes_asesoria_remitente
    FOREIGN KEY (id_usuario_remitente)
    REFERENCES usuarios(id_usuario)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
