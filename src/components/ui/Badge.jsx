const badgeCfg = {
  "Activo":       { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Inactivo":     { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Pendiente":    { bg: "#FFFBEB", text: "#92400E", dot: "#D97706" },
  "En progreso":  { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
  "Completado":   { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Cancelado":    { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Confirmada":   { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Pagado":       { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Alta":         { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Media":        { bg: "#FFFBEB", text: "#92400E", dot: "#D97706" },
  "Baja":         { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "admin":        { bg: "#F0F0F0", text: "#1A1814", dot: "#1A1814" },
  "tecnico":      { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
  "usuario":      { bg: "#F5F3FF", text: "#4C1D95", dot: "#7C3AED" },
};

export const Badge = ({ label }) => {
  const c = badgeCfg[label] || { bg: "#F0F0F0", text: "#555", dot: "#888" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span className="tag-dot" style={{ background: c.dot }} />{label}
    </span>
  );
};
