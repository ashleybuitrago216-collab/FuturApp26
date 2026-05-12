import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   GOOGLE FONTS
───────────────────────────────────────────── */
const FontLink = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ─────────────────────────────────────────────
   CSS VARS & GLOBAL STYLES
───────────────────────────────────────────── */
const GlobalStyle = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #F5F3EE;
        --surface: #FFFFFF;
        --surface2: #EDE9E0;
        --border: #D9D4C7;
        --accent: #C84B31;
        --accent2: #2C6E49;
        --accent3: #2563EB;
        --text: #1A1814;
        --text2: #5C5750;
        --text3: #9B958A;
        --shadow: 0 2px 12px rgba(0,0,0,0.08);
        --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
        --radius: 12px;
        --radius-sm: 8px;
        --font-head: 'Syne', sans-serif;
        --font-body: 'Outfit', sans-serif;
      }
      body { font-family: var(--font-body); background: var(--bg); color: var(--text); }
      input, select, textarea, button { font-family: var(--font-body); }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: var(--bg); }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      .nav-btn { transition: all 0.18s ease; }
      .nav-btn:hover { background: var(--surface2) !important; color: var(--text) !important; }
      .nav-btn.active { background: var(--text) !important; color: var(--bg) !important; }
      .row-hover:hover { background: #FAF8F4 !important; }
      .btn-primary { transition: all 0.15s ease; }
      .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
      .btn-ghost { transition: all 0.15s ease; }
      .btn-ghost:hover { background: var(--surface2) !important; }
      .card-hover { transition: box-shadow 0.2s ease, transform 0.2s ease; }
      .card-hover:hover { box-shadow: var(--shadow-lg) !important; transform: translateY(-2px); }
      @keyframes slideIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
      @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      .slide-in { animation: slideIn 0.28s ease forwards; }
      .fade-in  { animation: fadeIn  0.22s ease forwards; }
      .tag-dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

/* ─────────────────────────────────────────────
   INITIAL DATA SEED
───────────────────────────────────────────── */
const seed = {
  users: [
    { id: 1, nombre: "Alejandro", apellido: "Torres", correo: "admin@tech.com", password: "admin123", telefono: "3001234567", rol: "admin",    area: "",           activo: true },
    { id: 2, nombre: "María",     apellido: "Salcedo", correo: "tec@tech.com",   password: "tec123",   telefono: "3109876543", rol: "tecnico",  area: "Hardware",   activo: true },
    { id: 3, nombre: "Juan",      apellido: "Pérez",   correo: "user@tech.com",  password: "user123",  telefono: "3205551234", rol: "usuario",  area: "",           activo: true },
  ],
  servicios: [
    { id: 101, usuarioId: 3, tipo: "Mantenimiento de Hardware", descripcion: "PC se apaga sola", fecha: "2026-04-15", prioridad: "Alta",  estado: "En progreso", tecnicoId: 2 },
    { id: 102, usuarioId: 3, tipo: "Soporte técnico",           descripcion: "Configurar VPN",   fecha: "2026-04-20", prioridad: "Media", estado: "Pendiente",   tecnicoId: null },
  ],
  citas: [
    { id: 201, clienteId: 3, servicio: "Mantenimiento de Hardware", fecha: "2026-04-28", hora: "10:00", contacto: "3205551234", estado: "Confirmada", tecnicoId: 2 },
    { id: 202, clienteId: 3, servicio: "Asesoría de Software",       fecha: "2026-05-02", hora: "14:30", contacto: "3205551234", estado: "Pendiente",  tecnicoId: null },
  ],
  pagos: [
    { id: 301, txId: "TXN-4821", usuarioId: 3, servicio: "Mantenimiento de Hardware", fecha: "2026-04-15", valor: 180000, medio: "Nequi", estado: "Pagado" },
  ],
  comentarios: [
    { id: 401, autorId: 3, texto: "Excelente atención, muy profesionales.", fecha: "2026-04-16", hora: "15:42", respuesta: "¡Gracias! Es un placer atenderle.", respondidoPor: "admin" },
  ],
  notificaciones: [
    { id: 501, usuarioId: 3, mensaje: "Su cita del 28 de abril a las 10:00 fue confirmada.", fecha: "2026-04-23", leida: false, tipo: "cita" },
    { id: 502, usuarioId: 3, mensaje: "Pago de $180,000 recibido por Mantenimiento de Hardware.", fecha: "2026-04-15", leida: true,  tipo: "pago" },
  ],
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const uid  = () => Math.floor(Math.random() * 900000) + 100000;
const hoy  = () => new Date().toISOString().split("T")[0];
const hora = () => new Date().toTimeString().slice(0, 5);
const cop  = (v) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

/* ─────────────────────────────────────────────
   ICONS (inline SVG)
───────────────────────────────────────────── */
const icons = {
  home:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a7 7 0 0 1 11.33-5.5M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a7 7 0 0 0-5-6.7"/></svg>,
  tool:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  cal:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  pay:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  chat:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  bell:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chart:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  logout:  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus:    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check:   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  eye:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  down:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  shield:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  reply:   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
};
const Ic = ({ n, size = 16 }) => <span style={{ display: "inline-flex", alignItems: "center", width: size, height: size }}>{icons[n]}</span>;

/* ─────────────────────────────────────────────
   BADGE
───────────────────────────────────────────── */
const badgeCfg = {
  "Activo":       { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Inactivo":     { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Pendiente":    { bg: "#FFFBEB", text: "#92400E", dot: "#D97706" },
  "En progreso":  { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
  "Completado":   { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Cancelado":    { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Confirmada":   { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Cancelada":    { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Pagado":       { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "Alta":         { bg: "#FEF2F2", text: "#991B1B", dot: "#DC2626" },
  "Media":        { bg: "#FFFBEB", text: "#92400E", dot: "#D97706" },
  "Baja":         { bg: "#ECFDF5", text: "#065F46", dot: "#059669" },
  "admin":        { bg: "#F0F0F0", text: "#1A1814", dot: "#1A1814" },
  "tecnico":      { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6" },
  "usuario":      { bg: "#F5F3FF", text: "#4C1D95", dot: "#7C3AED" },
};
const Badge = ({ label }) => {
  const c = badgeCfg[label] || { bg: "#F0F0F0", text: "#555", dot: "#888" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", background: c.bg, color: c.text, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
      <span className="tag-dot" style={{ background: c.dot }} />{label}
    </span>
  );
};

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fade-in" style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)", padding: 16 }}>
    <div className="slide-in" style={{ background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: wide ? 680 : 500, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 80px rgba(0,0,0,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
        <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}><Ic n="x" /></button>
      </div>
      <div style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   FORM PRIMITIVES
───────────────────────────────────────────── */
const inputSt = { width: "100%", border: "1.5px solid var(--border)", borderRadius: 9, padding: "9px 12px", fontSize: 14, color: "var(--text)", background: "var(--bg)", outline: "none", fontFamily: "var(--font-body)", transition: "border-color 0.15s" };
const Field = ({ label, type = "text", value, onChange, opts, req, placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}{req && " *"}</label>
    {opts ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={inputSt}>
        <option value="">Seleccionar…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={req} placeholder={placeholder} style={inputSt} />
    )}
  </div>
);
const Grid2 = ({ children }) => <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;

/* ─────────────────────────────────────────────
   BUTTONS
───────────────────────────────────────────── */
const BtnPrimary = ({ onClick, children, icon, danger, small }) => (
  <button className="btn-primary" onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: small ? "7px 14px" : "10px 20px",
    borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: small ? 13 : 14,
    background: danger ? "var(--accent)" : "var(--text)", color: "var(--bg)", fontFamily: "var(--font-body)"
  }}>{icon && <Ic n={icon} />}{children}</button>
);
const BtnGhost = ({ onClick, children, icon, color }) => (
  <button className="btn-ghost" onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
    border: "1.5px solid var(--border)", cursor: "pointer", fontWeight: 500, fontSize: 13,
    background: "transparent", color: color || "var(--text2)", fontFamily: "var(--font-body)"
  }}>{icon && <Ic n={icon} />}{children}</button>
);
const IconBtn = ({ onClick, icon, title, color }) => (
  <button title={title} onClick={onClick} style={{ background: "var(--surface2)", border: "none", borderRadius: 7, padding: "6px", cursor: "pointer", display: "inline-flex", color: color || "var(--text2)", transition: "background 0.15s" }}><Ic n={icon} /></button>
);

/* ─────────────────────────────────────────────
   TABLE
───────────────────────────────────────────── */
const Table = ({ headers, rows }) => (
  <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
            {headers.map((h, i) => <th key={i} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ textAlign: "center", padding: 40, color: "var(--text3)", fontSize: 14 }}>Sin registros aún.</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="row-hover" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "12px 16px", fontSize: 14, color: "var(--text)", verticalAlign: "middle" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ label, value, icon, accent }) => (
  <div className="card-hover" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: "var(--shadow)" }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 20 }}><Ic n={icon} size={20} /></div>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: "var(--text)" }}>{value}</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────── */
const PageHead = ({ title, sub, action }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: "var(--text3)" }}>{sub}</p>}
    </div>
    {action}
  </div>
);

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div className="slide-in" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: isErr ? "#FEF2F2" : "#ECFDF5", border: `1.5px solid ${isErr ? "#FECACA" : "#BBF7D0"}`, color: isErr ? "#991B1B" : "#065F46", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-lg)", maxWidth: 340 }}>
      {toast.msg}
    </div>
  );
};

/* ═══════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════ */
export default function App() {
  const [data, setData]       = useState(seed);
  const [session, setSession] = useState(null);
  const [screen, setScreen]   = useState("login");   // login | register
  const [tab, setTab]         = useState("dashboard");
  const [regType, setRegType] = useState("usuario");
  const [toast, setToast]     = useState(null);

  const [loginF, setLoginF] = useState({ correo: "", password: "" });
  const [regF,   setRegF]   = useState({ nombre: "", apellido: "", correo: "", password: "", confirm: "", telefono: "", area: "" });

  const flash = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };

  const isAdmin  = session?.rol === "admin";
  const isTecnico = session?.rol === "tecnico" || isAdmin;
  const unread   = data.notificaciones.filter(n => n.usuarioId === session?.id && !n.leida).length;

  /* AUTH */
  const doLogin = () => {
    const u = data.users.find(u => u.correo === loginF.correo && u.password === loginF.password);
    if (!u)        return flash("Correo o contraseña incorrectos.", "error");
    if (!u.activo) return flash("Cuenta desactivada. Contacte al administrador.", "error");
    setSession(u); setTab("dashboard"); setLoginF({ correo: "", password: "" });
  };
  const doRegister = () => {
    if (!regF.nombre || !regF.correo || !regF.password) return flash("Complete los campos obligatorios.", "error");
    if (regF.password !== regF.confirm) return flash("Las contraseñas no coinciden.", "error");
    if (data.users.find(u => u.correo === regF.correo)) return flash("Ese correo ya está registrado.", "error");
    const nu = { id: uid(), nombre: regF.nombre, apellido: regF.apellido, correo: regF.correo, password: regF.password, telefono: regF.telefono, rol: regType, area: regF.area, activo: true };
    setData(d => ({ ...d, users: [...d.users, nu] }));
    flash("Cuenta creada. Inicia sesión."); setScreen("login");
    setRegF({ nombre: "", apellido: "", correo: "", password: "", confirm: "", telefono: "", area: "" });
  };
  const doLogout = () => { setSession(null); setScreen("login"); };

  /* SCREENS */
  if (!session) {
    return (
      <>
        <FontLink /><GlobalStyle />
        <AuthUI screen={screen} setScreen={setScreen} regType={regType} setRegType={setRegType}
          loginF={loginF} setLoginF={setLoginF} doLogin={doLogin}
          regF={regF} setRegF={setRegF} doRegister={doRegister} />
        <Toast toast={toast} />
      </>
    );
  }

  const navItems = [
    { id: "dashboard",      label: "Inicio",         icon: "home"  },
    { id: "usuarios",       label: "Usuarios",       icon: "users", admin: true },
    { id: "servicios",      label: "Servicios",      icon: "tool"  },
    { id: "citas",          label: "Citas",          icon: "cal"   },
    { id: "pagos",          label: "Pagos",          icon: "pay"   },
    { id: "comentarios",    label: "Comentarios",    icon: "chat"  },
    { id: "notificaciones", label: "Notificaciones", icon: "bell"  },
    { id: "informes",       label: "Informes",       icon: "chart", admin: true },
  ].filter(n => !n.admin || isAdmin);

  return (
    <>
      <FontLink /><GlobalStyle />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* SIDEBAR */}
        <aside style={{ width: 230, background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
          {/* Logo */}
          <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg)" }}><Ic n="shield" size={18} /></div>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "-0.02em" }}>TechSupport</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Sistema de Gestión</div>
              </div>
            </div>
          </div>
          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px" }}>
            {navItems.map(n => (
              <button key={n.id} className={`nav-btn${tab === n.id ? " active" : ""}`} onClick={() => setTab(n.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer", textAlign: "left", fontSize: 14, fontWeight: 500, marginBottom: 2, position: "relative", color: "var(--text2)", background: "transparent", fontFamily: "var(--font-body)" }}>
                <Ic n={n.icon} />
                {n.label}
                {n.id === "notificaciones" && unread > 0 && <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{unread}</span>}
              </button>
            ))}
          </nav>
          {/* User footer */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 50, background: "var(--text)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{session.nombre[0]}{session.apellido[0]}</div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.nombre} {session.apellido}</div>
                  <Badge label={session.rol} />
                </div>
              </div>
            </div>
            <button className="btn-ghost" onClick={doLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "var(--text3)", fontSize: 13, fontFamily: "var(--font-body)" }}>
              <Ic n="logout" /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflowY: "auto", padding: "30px 34px", background: "var(--bg)" }}>
          <div className="slide-in" key={tab}>
            {tab === "dashboard"      && <Dashboard      data={data} session={session} isAdmin={isAdmin} />}
            {tab === "usuarios"       && <UsuariosModule  data={data} setData={setData} session={session} flash={flash} />}
            {tab === "servicios"      && <ServiciosModule data={data} setData={setData} session={session} isAdmin={isAdmin} isTecnico={isTecnico} flash={flash} />}
            {tab === "citas"          && <CitasModule     data={data} setData={setData} session={session} isAdmin={isAdmin} flash={flash} />}
            {tab === "pagos"          && <PagosModule     data={data} setData={setData} session={session} isAdmin={isAdmin} flash={flash} />}
            {tab === "comentarios"    && <ComentariosModule data={data} setData={setData} session={session} isAdmin={isAdmin} flash={flash} />}
            {tab === "notificaciones" && <NotifModule     data={data} setData={setData} session={session} flash={flash} />}
            {tab === "informes"       && <InformesModule  data={data} flash={flash} />}
          </div>
        </main>
      </div>
      <Toast toast={toast} />
    </>
  );
}

/* ═══════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════ */
function AuthUI({ screen, setScreen, regType, setRegType, loginF, setLoginF, doLogin, regF, setRegF, doRegister }) {
  const setL = k => v => setLoginF(f => ({ ...f, [k]: v }));
  const setR = k => v => setRegF(f => ({ ...f, [k]: v }));
  const isReg = screen === "register";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", fontFamily: "var(--font-body)" }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: "var(--text)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, minWidth: 300 }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 24 }}><Ic n="shield" size={28} /></div>
        <h1 style={{ fontFamily: "var(--font-head)", color: "#fff", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12, textAlign: "center" }}>TechSupport</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>Sistema integral de gestión de servicios técnicos y soporte al cliente.</p>
        <div style={{ marginTop: 40, background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", maxWidth: 280 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Cuentas demo</p>
          {[["Admin", "admin@tech.com", "admin123"], ["Técnico", "tec@tech.com", "tec123"], ["Usuario", "user@tech.com", "user123"]].map(([r, e, p]) => (
            <div key={r} style={{ marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}><strong style={{ color: "rgba(255,255,255,0.6)" }}>{r}:</strong> {e} / {p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, minWidth: 360, overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{isReg ? "Crear cuenta" : "Bienvenido"}</h2>
          <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 28 }}>{isReg ? "Completa tus datos para registrarte." : "Ingresa tus credenciales para continuar."}</p>

          {isReg && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["usuario", "tecnico"].map(t => (
                <button key={t} onClick={() => setRegType(t)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: `1.5px solid ${regType === t ? "var(--text)" : "var(--border)"}`, background: regType === t ? "var(--text)" : "transparent", color: regType === t ? "var(--bg)" : "var(--text2)", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "var(--font-body)", textTransform: "capitalize" }}>
                  {t === "usuario" ? "🙋 Usuario" : "🔧 Técnico"}
                </button>
              ))}
            </div>
          )}

          {isReg && (
            <>
              <Grid2>
                <Field label="Nombre" value={regF.nombre} onChange={setR("nombre")} req />
                <Field label="Apellido" value={regF.apellido} onChange={setR("apellido")} />
              </Grid2>
              <Field label="Teléfono" value={regF.telefono} onChange={setR("telefono")} placeholder="Ej: 3001234567" />
              {regType === "tecnico" && <Field label="Área de especialidad" value={regF.area} onChange={setR("area")} opts={["Hardware", "Software", "Redes", "Soporte General"]} req />}
            </>
          )}

          <Field label="Correo electrónico" type="email" value={isReg ? regF.correo : loginF.correo} onChange={isReg ? setR("correo") : setL("correo")} req placeholder="correo@ejemplo.com" />
          <Field label="Contraseña" type="password" value={isReg ? regF.password : loginF.password} onChange={isReg ? setR("password") : setL("password")} req />
          {isReg && <Field label="Confirmar contraseña" type="password" value={regF.confirm} onChange={setR("confirm")} req />}

          <BtnPrimary onClick={isReg ? doRegister : doLogin}>{isReg ? "Crear cuenta" : "Iniciar sesión"}</BtnPrimary>

          <p style={{ marginTop: 18, fontSize: 14, color: "var(--text3)", textAlign: "center" }}>
            {isReg ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
            {" "}
            <button onClick={() => setScreen(isReg ? "login" : "register")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)", textDecoration: "underline" }}>
              {isReg ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════ */
function Dashboard({ data, session, isAdmin }) {
  const mySvcs  = isAdmin ? data.servicios : data.servicios.filter(s => s.usuarioId === session.id);
  const myCitas = isAdmin ? data.citas     : data.citas.filter(c => c.clienteId === session.id);
  const fecha   = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Hola, {session.nombre} 👋</h2>
        <p style={{ color: "var(--text3)", fontSize: 14, textTransform: "capitalize" }}>{fecha}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {isAdmin && <StatCard label="Usuarios"    value={data.users.length}         icon="users" accent="#7C3AED" />}
        <StatCard             label="Servicios"   value={mySvcs.length}             icon="tool"  accent="#C84B31" />
        <StatCard             label="Citas"       value={myCitas.length}            icon="cal"   accent="#2563EB" />
        <StatCard             label="Comentarios" value={data.comentarios.length}   icon="chat"  accent="#2C6E49" />
        {isAdmin && <StatCard label="Ingresos"    value={cop(data.pagos.reduce((a,p)=>a+p.valor,0))} icon="pay" accent="#D97706" />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Servicios recientes */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Servicios recientes</h3>
          {mySvcs.slice(0, 5).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{s.tipo}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{s.fecha}</div>
              </div>
              <Badge label={s.estado} />
            </div>
          ))}
          {mySvcs.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>Sin servicios registrados.</p>}
        </div>

        {/* Citas próximas */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Próximas citas</h3>
          {myCitas.slice(0, 5).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.servicio}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.fecha} — {c.hora}</div>
              </div>
              <Badge label={c.estado} />
            </div>
          ))}
          {myCitas.length === 0 && <p style={{ color: "var(--text3)", fontSize: 13 }}>Sin citas registradas.</p>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MÓDULO USUARIOS (RF001-RF005)
═══════════════════════════════════════════ */
function UsuariosModule({ data, setData, session, flash }) {
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre: "", apellido: "", correo: "", password: "", telefono: "", rol: "usuario", area: "", activo: true });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const openNew  = () => { setForm({ nombre: "", apellido: "", correo: "", password: "", telefono: "", rol: "usuario", area: "", activo: true }); setEditId(null); setModal("form"); };
  const openEdit = u  => { setForm({ ...u }); setEditId(u.id); setModal("form"); };

  const save = () => {
    if (!form.nombre || !form.correo) return flash("Nombre y correo son obligatorios.", "error");
    if (editId) {
      setData(d => ({ ...d, users: d.users.map(u => u.id === editId ? { ...u, ...form } : u) }));
      flash("Usuario actualizado correctamente.");
    } else {
      if (data.users.find(u => u.correo === form.correo)) return flash("Correo ya registrado.", "error");
      setData(d => ({ ...d, users: [...d.users, { id: uid(), ...form }] }));
      flash("Usuario creado correctamente.");
    }
    setModal(null);
  };

  const toggle  = id => { setData(d => ({ ...d, users: d.users.map(u => u.id === id ? { ...u, activo: !u.activo } : u) })); flash("Estado actualizado."); };
  const del     = id => { if (id === session.id) return flash("No puedes eliminarte a ti mismo.", "error"); setData(d => ({ ...d, users: d.users.filter(u => u.id !== id) })); flash("Usuario eliminado."); };
  const setRol  = (id, rol) => { setData(d => ({ ...d, users: d.users.map(u => u.id === id ? { ...u, rol } : u) })); flash("Rol actualizado."); };

  return (
    <div>
      <PageHead title="Gestión de Usuarios" sub="RF001 – RF005 · Registro, roles y administración de cuentas" action={<BtnPrimary icon="plus" onClick={openNew}>Nuevo usuario</BtnPrimary>} />
      <Table
        headers={["Nombre", "Correo", "Teléfono", "Rol", "Área", "Estado", "Acciones"]}
        rows={data.users.map(u => [
          <span style={{ fontWeight: 600 }}>{u.nombre} {u.apellido}</span>,
          u.correo,
          u.telefono || "—",
          <select value={u.rol} onChange={e => setRol(u.id, e.target.value)} style={{ ...inputSt, width: "auto", padding: "5px 8px", fontSize: 12 }}>
            {["usuario", "tecnico", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>,
          u.area || "—",
          <Badge label={u.activo ? "Activo" : "Inactivo"} />,
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn icon="edit"  title="Editar"             onClick={() => openEdit(u)} />
            <IconBtn icon={u.activo ? "x" : "check"} title={u.activo ? "Desactivar" : "Activar"} onClick={() => toggle(u.id)} color={u.activo ? "#C84B31" : "#2C6E49"} />
            <IconBtn icon="trash" title="Eliminar"           onClick={() => del(u.id)} color="#C84B31" />
          </div>
        ])}
      />
      {modal === "form" && (
        <Modal title={editId ? "Editar usuario" : "Nuevo usuario (RF001 / RF002)"} onClose={() => setModal(null)}>
          {!editId && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["usuario", "tecnico"].map(t => (
                <button key={t} onClick={() => set("rol")(t)} style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1.5px solid ${form.rol === t ? "var(--text)" : "var(--border)"}`, background: form.rol === t ? "var(--text)" : "transparent", color: form.rol === t ? "var(--bg)" : "var(--text2)", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "var(--font-body)", textTransform: "capitalize" }}>{t}</button>
              ))}
            </div>
          )}
          <Grid2>
            <Field label="Nombre"   value={form.nombre}   onChange={set("nombre")}   req />
            <Field label="Apellido" value={form.apellido} onChange={set("apellido")} />
          </Grid2>
          <Field label="Correo" type="email" value={form.correo} onChange={set("correo")} req />
          {!editId && <Field label="Contraseña" type="password" value={form.password} onChange={set("password")} />}
          <Field label="Teléfono" value={form.telefono} onChange={set("telefono")} />
          {form.rol === "tecnico" && <Field label="Área de especialidad" value={form.area} onChange={set("area")} opts={["Hardware", "Software", "Redes", "Soporte General"]} req />}
          {editId && (
            <Field label="Rol" value={form.rol} onChange={set("rol")} opts={["usuario", "tecnico", "admin"]} />
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <BtnPrimary onClick={save} icon="check">{editId ? "Guardar cambios" : "Crear usuario"}</BtnPrimary>
            <BtnGhost onClick={() => setModal(null)}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MÓDULO SERVICIOS (RF006-RF008)
═══════════════════════════════════════════ */
function ServiciosModule({ data, setData, session, isAdmin, isTecnico, flash }) {
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ tipo: "", descripcion: "", fecha: hoy(), prioridad: "Media" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mine = isAdmin ? data.servicios : session.rol === "tecnico" ? data.servicios.filter(s => s.tecnicoId === session.id) : data.servicios.filter(s => s.usuarioId === session.id);
  const tecnicos = data.users.filter(u => u.rol === "tecnico");
  const getUser  = id => { const u = data.users.find(u => u.id === id); return u ? `${u.nombre} ${u.apellido}` : "—"; };

  const save = () => {
    if (!form.tipo || !form.descripcion) return flash("Complete tipo y descripción.", "error");
    if (editId) {
      setData(d => ({ ...d, servicios: d.servicios.map(s => s.id === editId ? { ...s, ...form } : s) }));
      flash("Servicio actualizado.");
    } else {
      const ns = { id: uid(), usuarioId: session.id, ...form, estado: "Pendiente", tecnicoId: null };
      setData(d => ({ ...d, servicios: [...d.servicios, ns], notificaciones: [...d.notificaciones, { id: uid(), usuarioId: session.id, mensaje: `Solicitud de servicio "${form.tipo}" registrada.`, fecha: hoy(), leida: false, tipo: "servicio" }] }));
      flash("Servicio registrado. (RF008)");
    }
    setModal(null); setEditId(null);
  };

  const assignTec = (id, tid) => { setData(d => ({ ...d, servicios: d.servicios.map(s => s.id === id ? { ...s, tecnicoId: Number(tid) || null, estado: tid ? "En progreso" : "Pendiente" } : s) })); flash("Técnico asignado."); };
  const setEstado = (id, estado) => { setData(d => ({ ...d, servicios: d.servicios.map(s => s.id === id ? { ...s, estado } : s) })); flash("Estado actualizado."); };

  const TIPOS = ["Asesoría de Software", "Mantenimiento de Software", "Mantenimiento de Hardware", "Soporte técnico personalizado", "Control de entrega de servicios"];

  return (
    <div>
      <PageHead title="Gestión de Servicios" sub="RF006 – RF008 · Registro, seguimiento y cierre de solicitudes" action={<BtnPrimary icon="plus" onClick={() => { setForm({ tipo: "", descripcion: "", fecha: hoy(), prioridad: "Media" }); setEditId(null); setModal("form"); }}>Nuevo servicio</BtnPrimary>} />
      <Table
        headers={["#", "Tipo", "Descripción", "Fecha", "Prioridad", "Usuario", "Técnico asignado", "Estado", "Acciones"]}
        rows={mine.map(s => [
          <span style={{ color: "var(--text3)", fontSize: 12 }}>#{s.id}</span>,
          s.tipo,
          <span style={{ maxWidth: 180, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.descripcion}>{s.descripcion}</span>,
          s.fecha,
          <Badge label={s.prioridad} />,
          getUser(s.usuarioId),
          isAdmin ? (
            <select value={s.tecnicoId || ""} onChange={e => assignTec(s.id, e.target.value)} style={{ ...inputSt, width: "auto", padding: "5px 8px", fontSize: 12 }}>
              <option value="">Sin asignar</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.area})</option>)}
            </select>
          ) : getUser(s.tecnicoId),
          (isAdmin || isTecnico) ? (
            <select value={s.estado} onChange={e => setEstado(s.id, e.target.value)} style={{ ...inputSt, width: "auto", padding: "5px 8px", fontSize: 12 }}>
              {["Pendiente","En progreso","Completado","Cancelado"].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          ) : <Badge label={s.estado} />,
          <IconBtn icon="edit" title="Editar" onClick={() => { setForm({ tipo: s.tipo, descripcion: s.descripcion, fecha: s.fecha, prioridad: s.prioridad }); setEditId(s.id); setModal("form"); }} />
        ])}
      />
      {modal === "form" && (
        <Modal title={editId ? "Editar servicio" : "Registrar servicio (RF008)"} onClose={() => setModal(null)}>
          <Field label="Tipo de servicio" value={form.tipo} onChange={set("tipo")} opts={TIPOS} req />
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción del problema *</label>
            <textarea value={form.descripcion} onChange={e => set("descripcion")(e.target.value)} rows={3} style={{ ...inputSt, resize: "vertical", marginBottom: 14 }} placeholder="Describe el problema o la solicitud…" />
          </div>
          <Grid2>
            <Field label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} />
            <Field label="Prioridad" value={form.prioridad} onChange={set("prioridad")} opts={["Alta", "Media", "Baja"]} />
          </Grid2>
          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={save} icon="check">{editId ? "Guardar" : "Registrar"}</BtnPrimary>
            <BtnGhost onClick={() => setModal(null)}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MÓDULO CITAS (RF009-RF012)
═══════════════════════════════════════════ */
function CitasModule({ data, setData, session, isAdmin, flash }) {
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState({ servicio: "", fecha: hoy(), hora: "09:00", contacto: "" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mine = isAdmin ? data.citas : data.citas.filter(c => c.clienteId === session.id);
  const getUser = id => { const u = data.users.find(u => u.id === id); return u ? `${u.nombre} ${u.apellido}` : "—"; };

  const solicitar = () => {
    if (!form.servicio || !form.fecha || !form.hora) return flash("Complete todos los campos.", "error");
    // RF010: validar disponibilidad
    const conflicto = data.citas.find(c => c.fecha === form.fecha && c.hora === form.hora && c.estado !== "Cancelada");
    if (conflicto) return flash("Horario no disponible. Elija otro horario. (RF012)", "error");
    const nc = { id: uid(), clienteId: session.id, ...form, contacto: form.contacto || session.telefono, estado: "Pendiente", tecnicoId: null };
    setData(d => ({ ...d, citas: [...d.citas, nc] }));
    flash("Cita solicitada. Pendiente de confirmación. (RF009)");
    setModal(null);
  };

  const cambiar = (id, estado) => {
    const cita = data.citas.find(c => c.id === id);
    setData(d => ({ ...d, citas: d.citas.map(c => c.id === id ? { ...c, estado } : c) }));
    if (estado === "Confirmada" && cita) {
      // RF011: notificación automática al confirmar
      setData(d => ({ ...d, notificaciones: [...d.notificaciones, { id: uid(), usuarioId: cita.clienteId, mensaje: `Su cita para "${cita.servicio}" el ${cita.fecha} a las ${cita.hora} ha sido confirmada. (RF011)`, fecha: hoy(), leida: false, tipo: "cita" }] }));
      flash("Cita confirmada. Notificación enviada al usuario. (RF011)");
    } else {
      flash("Estado actualizado.");
    }
  };

  const SERVICIOS = ["Asesoría de Software", "Mantenimiento de Software", "Mantenimiento de Hardware", "Soporte técnico personalizado", "Control de entrega de servicios"];

  return (
    <div>
      <PageHead title="Gestión de Citas" sub="RF009 – RF012 · Agendamiento, solicitud y seguimiento de citas" action={<BtnPrimary icon="plus" onClick={() => { setForm({ servicio: "", fecha: hoy(), hora: "09:00", contacto: "" }); setModal("form"); }}>Solicitar cita</BtnPrimary>} />
      <Table
        headers={["#", "Cliente", "Servicio", "Fecha", "Hora", "Contacto", "Estado", "Acciones"]}
        rows={mine.map(c => [
          <span style={{ color: "var(--text3)", fontSize: 12 }}>#{c.id}</span>,
          getUser(c.clienteId),
          c.servicio,
          c.fecha,
          c.hora,
          c.contacto,
          <Badge label={c.estado} />,
          <div style={{ display: "flex", gap: 6 }}>
            {isAdmin && c.estado === "Pendiente"   && <IconBtn icon="check" title="Confirmar" onClick={() => cambiar(c.id, "Confirmada")} color="#2C6E49" />}
            {isAdmin && c.estado === "Confirmada"  && <IconBtn icon="edit"  title="Modificar" onClick={() => flash("Función de modificación disponible.")} />}
            {c.estado !== "Cancelada"              && <IconBtn icon="x"     title="Cancelar"  onClick={() => cambiar(c.id, "Cancelada")} color="#C84B31" />}
          </div>
        ])}
      />
      {modal === "form" && (
        <Modal title="Solicitar cita (RF009 / RF010)" onClose={() => setModal(null)}>
          <Field label="Servicio solicitado" value={form.servicio} onChange={set("servicio")} opts={SERVICIOS} req />
          <Grid2>
            <Field label="Fecha" type="date" value={form.fecha} onChange={set("fecha")} req />
            <Field label="Hora"  type="time" value={form.hora}  onChange={set("hora")}  req />
          </Grid2>
          <Field label="Teléfono de contacto" value={form.contacto} onChange={set("contacto")} placeholder={session.telefono || "3001234567"} />
          <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>⚡ El sistema valida disponibilidad automáticamente (RF010 / RF012).</p>
          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={solicitar} icon="cal">Solicitar cita</BtnPrimary>
            <BtnGhost onClick={() => setModal(null)}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MÓDULO PAGOS (RF013)
═══════════════════════════════════════════ */
function PagosModule({ data, setData, session, isAdmin, flash }) {
  const [modal, setModal]  = useState(null);
  const [comp, setComp]    = useState(null);
  const [form, setForm]    = useState({ servicio: "", valor: "", medio: "Nequi" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const mine = isAdmin ? data.pagos : data.pagos.filter(p => p.usuarioId === session.id);
  const getUser = id => { const u = data.users.find(u => u.id === id); return u ? `${u.nombre} ${u.apellido}` : "—"; };

  const registrar = () => {
    if (!form.servicio || !form.valor) return flash("Complete todos los campos.", "error");
    const p = { id: uid(), txId: `TXN-${uid()}`, usuarioId: session.id, servicio: form.servicio, fecha: hoy(), valor: Number(form.valor), medio: form.medio, estado: "Pagado" };
    setData(d => ({ ...d, pagos: [...d.pagos, p], notificaciones: [...d.notificaciones, { id: uid(), usuarioId: session.id, mensaje: `Pago de ${cop(p.valor)} recibido por "${p.servicio}". ID: ${p.txId}.`, fecha: hoy(), leida: false, tipo: "pago" }] }));
    flash("Pago registrado. Comprobante generado. (RF013)");
    setComp(p); setModal(null);
  };

  const SERVICIOS = ["Asesoría de Software", "Mantenimiento de Software", "Mantenimiento de Hardware", "Soporte técnico personalizado"];

  return (
    <div>
      <PageHead title="Módulo de Pagos" sub="RF013 · Registro de transacciones y comprobantes de pago" action={<BtnPrimary icon="plus" onClick={() => { setForm({ servicio: "", valor: "", medio: "Nequi" }); setModal("form"); }}>Registrar pago</BtnPrimary>} />
      <Table
        headers={["ID Transacción", "Usuario", "Servicio", "Fecha", "Valor", "Medio", "Estado", "Comprobante"]}
        rows={mine.map(p => [
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text2)" }}>{p.txId}</span>,
          getUser(p.usuarioId),
          p.servicio,
          p.fecha,
          <span style={{ fontWeight: 700 }}>{cop(p.valor)}</span>,
          p.medio,
          <Badge label={p.estado} />,
          <IconBtn icon="eye" title="Ver comprobante" onClick={() => setComp(p)} color="#2563EB" />
        ])}
      />

      {modal === "form" && (
        <Modal title="Registrar pago (RF013)" onClose={() => setModal(null)}>
          <Field label="Servicio" value={form.servicio} onChange={set("servicio")} opts={SERVICIOS} req />
          <Field label="Valor (COP)" type="number" value={form.valor} onChange={set("valor")} req placeholder="Ej: 180000" />
          <Field label="Medio de pago" value={form.medio} onChange={set("medio")} opts={["Efectivo", "Bancolombia", "Nequi", "DaviPlata"]} req />
          <div style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={registrar} icon="check">Registrar pago</BtnPrimary>
            <BtnGhost onClick={() => setModal(null)}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}

      {/* COMPROBANTE */}
      {comp && (
        <Modal title="Comprobante de pago (RF013)" onClose={() => setComp(null)}>
          <div style={{ background: "var(--bg)", border: "2px dashed var(--border)", borderRadius: 12, padding: 24, textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 50, background: "#ECFDF5", border: "2px solid #059669", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#059669" }}><Ic n="check" size={22} /></div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>PAGO EXITOSO</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#2C6E49", fontFamily: "var(--font-head)" }}>{cop(comp.valor)}</div>
          </div>
          {[["ID Transacción", comp.txId], ["Servicio", comp.servicio], ["Fecha", comp.fecha], ["Medio de pago", comp.medio], ["Estado", comp.estado]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text3)", fontSize: 13 }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{v}</span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 16 }}>TechSupport · Comprobante generado automáticamente · {hoy()}</p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
            <BtnGhost icon="down" onClick={() => flash("Función de descarga disponible en producción.")}>Descargar PDF</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MÓDULO COMENTARIOS (RF014-RF015)
═══════════════════════════════════════════ */
function ComentariosModule({ data, setData, session, isAdmin, flash }) {
  const [texto, setTexto] = useState("");
  const [resps, setResps] = useState({});
  const getUser = id => { const u = data.users.find(u => u.id === id); return u ? `${u.nombre} ${u.apellido}` : "—"; };

  const publicar = () => {
    if (!texto.trim()) return flash("Escribe un comentario antes de publicar.", "error");
    setData(d => ({ ...d, comentarios: [...d.comentarios, { id: uid(), autorId: session.id, texto, fecha: hoy(), hora: hora(), respuesta: null, respondidoPor: null }] }));
    setTexto(""); flash("Comentario publicado. (RF014)");
  };

  const responder = id => {
    const r = resps[id];
    if (!r?.trim()) return flash("Escribe una respuesta.", "error");
    setData(d => ({ ...d, comentarios: d.comentarios.map(c => c.id === id ? { ...c, respuesta: r, respondidoPor: `${session.nombre} ${session.apellido}` } : c) }));
    setResps(r => ({ ...r, [id]: "" })); flash("Respuesta enviada. (RF015)");
  };

  return (
    <div>
      <PageHead title="Comentarios y Retroalimentación" sub="RF014 – RF015 · Gestión de comentarios y respuestas" />
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22, marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nuevo comentario (RF014)</label>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={3} style={{ ...inputSt, resize: "vertical", marginBottom: 12 }} placeholder="Escribe tu comentario sobre el servicio recibido…" />
        <BtnPrimary onClick={publicar} icon="chat">Publicar comentario</BtnPrimary>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[...data.comentarios].reverse().map(c => (
          <div key={c.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 50, background: "var(--text)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                {getUser(c.autorId).split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{getUser(c.autorId)}</div>
                <div style={{ fontSize: 12, color: "var(--text3)" }}>{c.fecha} · {c.hora}</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>{c.texto}</p>

            {c.respuesta && (
              <div style={{ background: "var(--surface2)", borderLeft: "3px solid var(--accent3)", borderRadius: "0 10px 10px 0", padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>↩ Respuesta — {c.respondidoPor}</div>
                <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{c.respuesta}</p>
              </div>
            )}

            {isAdmin && !c.respuesta && (
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <input value={resps[c.id] || ""} onChange={e => setResps(r => ({ ...r, [c.id]: e.target.value }))} style={{ ...inputSt, flex: 1 }} placeholder="Escribe una respuesta… (RF015)" />
                <BtnPrimary onClick={() => responder(c.id)} icon="reply" small>Responder</BtnPrimary>
              </div>
            )}
          </div>
        ))}
        {data.comentarios.length === 0 && <p style={{ color: "var(--text3)", textAlign: "center", padding: 30 }}>Sin comentarios todavía.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   NOTIFICACIONES (RF011 / RF017)
═══════════════════════════════════════════ */
function NotifModule({ data, setData, session, flash }) {
  const mine = [...data.notificaciones].filter(n => n.usuarioId === session.id).sort((a, b) => b.id - a.id);

  const markRead  = id  => setData(d => ({ ...d, notificaciones: d.notificaciones.map(n => n.id === id ? { ...n, leida: true } : n) }));
  const markAll   = ()  => { setData(d => ({ ...d, notificaciones: d.notificaciones.map(n => n.usuarioId === session.id ? { ...n, leida: true } : n) })); flash("Todas marcadas como leídas."); };

  const tipoColor = { cita: "#2563EB", pago: "#2C6E49", servicio: "#C84B31", sistema: "#D97706" };
  const tipoIcon  = { cita: "cal", pago: "pay", servicio: "tool", sistema: "shield" };

  return (
    <div>
      <PageHead title="Notificaciones" sub="RF011 · RF017 · Alertas en tiempo real sobre citas, pagos y servicios" action={<BtnGhost onClick={markAll} icon="check">Marcar todas leídas</BtnGhost>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mine.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)} style={{ background: "var(--surface)", border: `1.5px solid ${n.leida ? "var(--border)" : tipoColor[n.tipo] || "var(--border)"}`, borderLeft: `5px solid ${n.leida ? "var(--border)" : tipoColor[n.tipo] || "var(--accent)"}`, borderRadius: 11, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, opacity: n.leida ? 0.7 : 1, transition: "all 0.15s" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: (tipoColor[n.tipo] || "#888") + "18", display: "flex", alignItems: "center", justifyContent: "center", color: tipoColor[n.tipo] || "var(--text2)", flexShrink: 0 }}>
              <Ic n={tipoIcon[n.tipo] || "bell"} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: n.leida ? 400 : 600, color: n.leida ? "var(--text2)" : "var(--text)", margin: 0, lineHeight: 1.5 }}>{n.mensaje}</p>
              <span style={{ fontSize: 11, color: "var(--text3)" }}>{n.fecha}</span>
            </div>
            {!n.leida && <div style={{ width: 9, height: 9, borderRadius: 50, background: "var(--accent)", flexShrink: 0 }} />}
          </div>
        ))}
        {mine.length === 0 && <p style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 14 }}>No tienes notificaciones.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   INFORMES (RF016)
═══════════════════════════════════════════ */
function InformesModule({ data, flash }) {
  const [form, setForm] = useState({ tipo: "General", periodo: "mensual", formato: "PDF", solicitante: "", frecuencia: "Única vez" });
  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const stats = {
    usuarios:     data.users.length,
    activos:      data.users.filter(u => u.activo).length,
    tecnicos:     data.users.filter(u => u.rol === "tecnico").length,
    servicios:    data.servicios.length,
    completados:  data.servicios.filter(s => s.estado === "Completado").length,
    pendientes:   data.servicios.filter(s => s.estado === "Pendiente").length,
    citas:        data.citas.length,
    confirmadas:  data.citas.filter(c => c.estado === "Confirmada").length,
    ingresos:     data.pagos.reduce((a, p) => a + p.valor, 0),
    pagos:        data.pagos.length,
    comentarios:  data.comentarios.length,
    respondidos:  data.comentarios.filter(c => c.respuesta).length,
  };

  const resumen = [
    { label: "Usuarios activos",         value: `${stats.activos} / ${stats.usuarios}` },
    { label: "Técnicos registrados",      value: stats.tecnicos },
    { label: "Servicios completados",     value: `${stats.completados} / ${stats.servicios}` },
    { label: "Servicios pendientes",      value: stats.pendientes },
    { label: "Citas confirmadas",         value: `${stats.confirmadas} / ${stats.citas}` },
    { label: "Total ingresos",            value: cop(stats.ingresos) },
    { label: "Pagos registrados",         value: stats.pagos },
    { label: "Comentarios respondidos",   value: `${stats.respondidos} / ${stats.comentarios}` },
  ];

  return (
    <div>
      <PageHead title="Informes y Reportes" sub="RF016 · Generación de informes con filtros de período, tipo y formato" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Usuarios"  value={stats.usuarios}   icon="users" accent="#7C3AED" />
        <StatCard label="Servicios" value={stats.servicios}  icon="tool"  accent="#C84B31" />
        <StatCard label="Citas"     value={stats.citas}      icon="cal"   accent="#2563EB" />
        <StatCard label="Ingresos"  value={cop(stats.ingresos)} icon="pay" accent="#2C6E49" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Generador */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, marginBottom: 18, color: "var(--text)" }}>Generar informe (RF016)</h3>
          <Field label="Tipo de informe" value={form.tipo} onChange={set("tipo")} opts={["General", "Usuarios", "Servicios", "Citas", "Pagos", "Comentarios"]} />
          <Field label="Período de análisis" value={form.periodo} onChange={set("periodo")} opts={["diario", "semanal", "mensual", "trimestral", "anual"]} />
          <Field label="Formato de entrega" value={form.formato} onChange={set("formato")} opts={["PDF", "Excel", "Gráfico", "CSV"]} />
          <Field label="Solicitante" value={form.solicitante} onChange={set("solicitante")} placeholder="Nombre del solicitante" />
          <Field label="Frecuencia" value={form.frecuencia} onChange={set("frecuencia")} opts={["Única vez", "Semanal", "Mensual", "Trimestral"]} />
          <BtnPrimary onClick={() => flash(`Informe "${form.tipo}" (${form.periodo}) generado en ${form.formato}. (RF016)`)} icon="down">Generar y descargar</BtnPrimary>
        </div>

        {/* Resumen */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, marginBottom: 18, color: "var(--text)" }}>Resumen del sistema</h3>
          {resumen.map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 13, color: "var(--text2)" }}>{r.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-head)" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}