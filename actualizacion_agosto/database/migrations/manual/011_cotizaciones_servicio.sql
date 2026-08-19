CREATE TABLE IF NOT EXISTS cotizaciones (
  id_cotizacion INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud_servicio INT NOT NULL,
  id_usuario_cliente INT NOT NULL,
  id_usuario_tecnico INT NOT NULL,
  id_pago INT NULL,
  monto DECIMAL(10,2) NOT NULL,
  descripcion TEXT NULL,
  estado VARCHAR(40) NOT NULL DEFAULT 'Enviada',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta DATETIME NULL,
  fecha_actualizacion DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_cotizaciones_solicitud_servicio
    UNIQUE (id_solicitud_servicio),

  CONSTRAINT uq_cotizaciones_pago
    UNIQUE (id_pago),

  CONSTRAINT fk_cotizaciones_solicitud_servicio
    FOREIGN KEY (id_solicitud_servicio)
    REFERENCES solicitudes_servicio(id_solicitud_servicio),

  CONSTRAINT fk_cotizaciones_cliente
    FOREIGN KEY (id_usuario_cliente)
    REFERENCES usuarios(id_usuario),

  CONSTRAINT fk_cotizaciones_tecnico
    FOREIGN KEY (id_usuario_tecnico)
    REFERENCES usuarios(id_usuario),

  CONSTRAINT fk_cotizaciones_pago
    FOREIGN KEY (id_pago)
    REFERENCES pagos(id_pago)
);
