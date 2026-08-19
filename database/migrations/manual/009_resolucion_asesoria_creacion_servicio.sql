-- FuturApp - Fase resolucion de asesoria y creacion de servicio
-- Cambio aditivo: relaciona una asesoria resuelta con exactamente una solicitud de servicio.
-- Ejecutar sobre la base oficial futurapp despues de crear backup.

ALTER TABLE asesorias
  ADD COLUMN id_solicitud_servicio INT NULL AFTER id_tipo_servicio;

ALTER TABLE asesorias
  ADD CONSTRAINT uq_asesorias_solicitud_servicio
  UNIQUE (id_solicitud_servicio);

ALTER TABLE asesorias
  ADD CONSTRAINT fk_asesorias_solicitud_servicio
  FOREIGN KEY (id_solicitud_servicio)
  REFERENCES solicitudes_servicio(id_solicitud_servicio)
  ON DELETE SET NULL
  ON UPDATE CASCADE;
