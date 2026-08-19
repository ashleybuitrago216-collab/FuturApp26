import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_USER_SCHEMA = {
  table: LEGACY_TABLES.users,
  primaryKey: "id_usrs",
  emailUniqueKey: "correo",
  roleForeignKey: "id_rol",
  areaForeignKey: "id_area",
  documentTypeForeignKey: "id_tp_doc",
};

