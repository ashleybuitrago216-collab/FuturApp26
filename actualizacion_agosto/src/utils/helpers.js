export const uid = () => Math.floor(Math.random() * 900000) + 100000;
export const hoy = () => new Date().toISOString().split("T")[0];
export const hora = () => new Date().toTimeString().slice(0, 5);
export const cop  = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);
export const timestamp = () => new Date().getTime();
export const fechaHoraAmPm = () => {
  const now = new Date();
  const fecha = now.toISOString().split("T")[0];
  const hora = now.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${fecha} ${hora.toUpperCase()}`;
};
