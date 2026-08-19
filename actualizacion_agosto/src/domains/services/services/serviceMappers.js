export function normalizeServiceFromApi(service) {
  return {
    id: service.id,
    usuarioId: service.userId,
    tecnicoId: service.technicianId,
    tipo: service.serviceType,
    descripcion: service.description,
    prioridad: service.priority,
    estado: service.status,
    isCompleted: Boolean(service.isCompleted ?? service.completado),
    canComplete: Boolean(service.canComplete ?? service.puedeCompletar),
    fecha: service.date || service.createdAt,
    valor: service.value,
    amount: service.amount,
    monto: service.monto,
    formattedAmount: service.formattedAmount || service.montoFormateado,
    paymentId: service.paymentId || service.pagoId,
    paymentStatus: service.paymentStatus || service.estadoPago,
    canPay: Boolean(service.canPay ?? service.puedePagar),
    paymentBlockedReason: service.paymentBlockedReason || service.motivoBloqueoPago || "",
    serviceLocation: service.serviceLocation || service.ubicacionServicio || null,
    ubicacionServicio: service.ubicacionServicio || service.serviceLocation || null,
    technicianLocation: service.technicianLocation || service.ubicacionTecnico || null,
    ubicacionTecnico: service.ubicacionTecnico || service.technicianLocation || null,
    quote: service.quote || service.cotizacion || null,
    cotizacion: service.cotizacion || service.quote || null,
    quoteStatus: service.quoteStatus || service.estadoCotizacion || "Sin cotizacion",
    estadoCotizacion: service.estadoCotizacion || service.quoteStatus || "Sin cotizacion",
    duracion: service.duration,
    createdAt: service.createdAt ? new Date(service.createdAt).getTime() : Date.now(),
    editableUntil: service.createdAt ? new Date(service.createdAt).getTime() + 5 * 60 * 1000 : null,
    client: service.client,
    technician: service.technician,
    advisoryOriginId: service.advisoryOriginId || service.asesoriaOrigenId || service.advisoryOrigin?.id || service.asesoriaOrigen?.id || null,
    asesoriaOrigenId: service.asesoriaOrigenId || service.advisoryOriginId || service.asesoriaOrigen?.id || service.advisoryOrigin?.id || null,
    advisoryOrigin: service.advisoryOrigin || service.asesoriaOrigen || null,
    asesoriaOrigen: service.asesoriaOrigen || service.advisoryOrigin || null,
  };
}

export function mapServiceToApiPayload(form) {
  const payload = {
    description: form.descripcion,
    serviceType: form.tipo,
    priority: form.prioridad,
    status: form.estado,
    technicianId: form.tecnicoId,
  };

  if (form.location?.latitude || form.location?.longitude || form.location?.addressReference) {
    payload.location = form.location;
  }

  return payload;
}
