-- FuturApp - verificacion tecnica de pagos simulados
-- Ejecutar manualmente sobre la base oficial futurapp.
-- No reemplaza el estado financiero de pagos; agrega auditoria separada.

CREATE TABLE IF NOT EXISTS verificaciones_pago (
  id_verificacion_pago INT NOT NULL AUTO_INCREMENT,
  id_pago INT NOT NULL,
  id_usuario_tecnico INT NULL,
  id_medio_pago_tecnico INT NULL,
  cantidad_intentos INT NOT NULL DEFAULT 0,
  metodos_coinciden BOOLEAN NULL,
  requiere_revision BOOLEAN NOT NULL DEFAULT FALSE,
  observacion TEXT NULL,
  fecha_primer_intento DATETIME NULL,
  fecha_confirmacion DATETIME NULL,
  PRIMARY KEY (id_verificacion_pago),
  UNIQUE KEY uq_verificaciones_pago_id_pago (id_pago),
  KEY idx_verificaciones_pago_id_usuario_tecnico (id_usuario_tecnico),
  KEY idx_verificaciones_pago_id_medio_pago_tecnico (id_medio_pago_tecnico),
  CONSTRAINT fk_verificaciones_pago_pago
    FOREIGN KEY (id_pago) REFERENCES pagos (id_pago)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_verificaciones_pago_usuario_tecnico
    FOREIGN KEY (id_usuario_tecnico) REFERENCES usuarios (id_usuario)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_verificaciones_pago_medio_pago_tecnico
    FOREIGN KEY (id_medio_pago_tecnico) REFERENCES medios_pago (id_medio_pago)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
