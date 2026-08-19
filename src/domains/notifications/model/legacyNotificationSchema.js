import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_NOTIFICATION_SCHEMA = {
  table: LEGACY_TABLES.notifications,
  primaryKey: "id_notificacion",
  userForeignKey: "id_usrs",
  typeForeignKey: "id_tipo_notif",
};

