export function mapLegacyComment(row, response) {
  if (!row) return null;

  return {
    id: row.id_comentario,
    citaId: row.id_cita,
    autorId: row.id_usrs,
    texto: row.texto || "",
    fecha: String(row.fecha_comentario || "").slice(0, 10),
    hora: String(row.fecha_comentario || "").slice(11, 16),
    respuesta: response?.texto_respuesta || null,
    respondidoPor: response?.id_respondedor || null,
  };
}

export function toLegacyCommentPayload(comment) {
  return {
    id_cita: comment.citaId || null,
    id_usrs: comment.autorId,
    fecha_comentario: `${comment.fecha} ${comment.hora || "00:00"}`,
  };
}

