export function mapLegacyPayment(row, lookups = {}) {
  if (!row) return null;

  return {
    id: row.id_pago,
    txId: row.detalle_comprobante || `PAY-${row.id_pago}`,
    usuarioId: row.id_usrs,
    citaId: row.id_cita,
    servicio: lookups.appointments?.[row.id_cita] || row.id_cita,
    fecha: String(row.fecha_pago || "").slice(0, 10),
    valor: Number(row.monto || 0),
    medio: lookups.paymentMethods?.[row.id_medio] || row.id_medio,
    estado: lookups.paymentStatuses?.[row.id_estado_pago] || row.id_estado_pago,
  };
}

export function toLegacyPaymentPayload(payment) {
  return {
    id_cita: payment.citaId || null,
    id_medio: payment.medio,
    id_estado_pago: payment.estado,
    id_usrs: payment.usuarioId,
    monto: payment.valor,
    fecha_pago: payment.fecha,
    detalle_comprobante: payment.txId,
  };
}

