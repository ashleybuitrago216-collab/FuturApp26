import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_APPOINTMENT_SCHEMA = {
  table: LEGACY_TABLES.appointments,
  primaryKey: "id_cita",
  requestForeignKey: "id_solicitud",
  userForeignKey: "id_usrs",
  statusForeignKey: "id_estado",
};

