import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_SERVICE_SCHEMA = {
  table: LEGACY_TABLES.serviceRequests,
  primaryKey: "id_solicitud",
  userForeignKey: "id_usrs",
  deviceForeignKey: "id_equipo",
  serviceTypeForeignKey: "id_tp_servicio",
  priorityForeignKey: "id_prioridad",
  statusForeignKey: "id_estado",
};

