export function calculateReportStats(data) {
  return {
    usuarios: data.users.length,
    servicios: data.servicios.length,
    citas: data.citas.length,
    ingresos: data.pagos.reduce((total, payment) => total + payment.valor, 0),
  };
}

