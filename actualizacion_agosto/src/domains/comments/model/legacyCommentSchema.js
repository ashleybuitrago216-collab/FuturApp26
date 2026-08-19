import { LEGACY_TABLES } from "../../../infrastructure/database/legacyTables";

export const LEGACY_COMMENT_SCHEMA = {
  table: LEGACY_TABLES.comments,
  primaryKey: "id_comentario",
  appointmentForeignKey: "id_cita",
  userForeignKey: "id_usrs",
  responseTable: LEGACY_TABLES.commentResponses,
};

