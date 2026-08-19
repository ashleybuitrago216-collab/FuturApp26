import { Ic } from "./Icon";

export const BtnPrimary = ({ onClick, children, icon, danger, small, disabled, type }) => (
  <button type={type} className="btn-primary" onClick={onClick} disabled={disabled} style={{
    display: "inline-flex", alignItems: "center", gap: 7, padding: small ? "7px 14px" : "10px 20px",
    borderRadius: 9, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: small ? 13 : 14,
    background: danger ? "var(--accent)" : "var(--text)", color: "var(--bg)", fontFamily: "var(--font-body)", opacity: disabled ? 0.55 : 1
  }}>{icon && <Ic n={icon} />}{children}</button>
);

export const BtnGhost = ({ onClick, children, icon, color, type = "button" }) => (
  <button type={type} className="btn-ghost" onClick={onClick} style={{
    display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
    border: "1.5px solid var(--border)", cursor: "pointer", fontWeight: 500, fontSize: 13,
    background: "transparent", color: color || "var(--text2)", fontFamily: "var(--font-body)"
  }}>{icon && <Ic n={icon} />}{children}</button>
);

export const IconBtn = ({ onClick, icon, title, color }) => (
  <button title={title} onClick={onClick} style={{ background: "var(--surface2)", border: "none", borderRadius: 7, padding: "6px", cursor: "pointer", display: "inline-flex", color: color || "var(--text2)", transition: "background 0.15s" }}><Ic n={icon} /></button>
);
