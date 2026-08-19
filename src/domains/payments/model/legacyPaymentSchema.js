import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_PAYMENT_SCHEMA = {
  table: LEGACY_TABLES.payments,
  primaryKey: "id_pago",
  appointmentForeignKey: "id_cita",
  methodForeignKey: "id_medio",
  statusForeignKey: "id_estado_pago",
  userForeignKey: "id_usrs",
};

