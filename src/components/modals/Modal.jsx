import { Ic } from "../ui/Icon";

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="modal-overlay fade-in" style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)", padding: 16 }}>
    <div className="modal-card slide-in" style={{ background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: wide ? 680 : 500, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 80px rgba(0,0,0,0.18)" }}>
      <div className="modal-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
        <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}><Ic n="x" /></button>
      </div>
      <div className="modal-body" style={{ padding: "20px 24px" }}>{children}</div>
    </div>
  </div>
);
