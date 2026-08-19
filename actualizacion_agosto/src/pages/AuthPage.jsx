import { useMemo, useState } from "react";
import { Field, Grid2 } from "../components/ui/Field";
import { BtnGhost, BtnPrimary } from "../components/ui/Button";
import { authApi } from "../domains/auth/services/authApi";
import { BRAND } from "../shared/constants/brand";

const PASSWORD_RECOVERY_MESSAGE = "Si el correo esta registrado, enviaremos instrucciones para recuperar la contrasena.";

function getResetTokenFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") || "";
}

export function AuthUI({ screen, setScreen, loginF, setLoginF, doLogin, regF, setRegF, doRegister, flash }) {
  const setL = key => value => setLoginF(current => ({ ...current, [key]: value }));
  const setR = key => value => setRegF(current => ({ ...current, [key]: value }));
  const isReg = screen === "register";
  const isForgot = screen === "forgot-password";
  const isReset = screen === "reset-password";
  const resetToken = useMemo(() => getResetTokenFromUrl(), []);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [devResetLink, setDevResetLink] = useState("");
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
  const [resetMessage, setResetMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const canShowDevResetLink = import.meta.env.DEV;

  const goLogin = () => {
    setForgotMessage("");
    setDevResetLink("");
    setResetMessage("");
    setScreen("login");
  };

  const submitForgotPassword = async () => {
    if (!forgotEmail) return flash?.("Ingresa tu correo electronico.", "error");

    try {
      setSaving(true);
      const response = await authApi.forgotPassword(forgotEmail);
      setForgotMessage(response.message || PASSWORD_RECOVERY_MESSAGE);
      setDevResetLink(response.devResetLink || "");
    } catch (error) {
      flash?.(error.message || "No se pudo solicitar la recuperacion.", "error");
    } finally {
      setSaving(false);
    }
  };

  const submitResetPassword = async () => {
    if (!resetToken) return flash?.("El enlace de recuperacion no es valido o expiro.", "error");
    if (!resetForm.password || !resetForm.confirmPassword) return flash?.("Completa la nueva contrasena y su confirmacion.", "error");
    if (resetForm.password !== resetForm.confirmPassword) return flash?.("Las contrasenas no coinciden.", "error");
    if (resetForm.password.length < 8 || !/[A-Za-z]/.test(resetForm.password) || !/\d/.test(resetForm.password)) {
      return flash?.("La contrasena debe tener al menos 8 caracteres e incluir una letra y un numero.", "error");
    }

    try {
      setSaving(true);
      const response = await authApi.resetPassword({
        token: resetToken,
        password: resetForm.password,
        confirmPassword: resetForm.confirmPassword,
      });
      setResetMessage(response.message || "Contrasena actualizada correctamente. Ya puedes iniciar sesion.");
      setResetForm({ password: "", confirmPassword: "" });
    } catch (error) {
      flash?.(error.message || "No se pudo restablecer la contrasena.", "error");
    } finally {
      setSaving(false);
    }
  };

  const title = isForgot
    ? "Recuperar contrasena"
    : isReset
      ? "Nueva contrasena"
      : isReg
        ? "Crear cuenta"
        : "Bienvenido";
  const subtitle = isForgot
    ? "Ingresa tu correo para recibir instrucciones de recuperacion."
    : isReset
      ? "Define una nueva contrasena para tu cuenta."
      : isReg
        ? "Completa tus datos para registrarte."
        : "Ingresa tus credenciales para continuar.";

  return (
    <div className="auth-page" style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", fontFamily: "var(--font-body)" }}>
      <div className="auth-side" style={{ flex: 1, background: "#040A15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, minWidth: 300 }}>
        <img className="auth-side-logo brand-logo-login" src={BRAND.logo} alt={BRAND.name} style={{ width: 220, height: 220, objectFit: "contain", marginBottom: 18, borderRadius: 18, boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }} />
        <h1 className="auth-side-title" style={{ fontFamily: "var(--font-head)", color: "#fff", fontSize: 32, fontWeight: 800, letterSpacing: "0", marginBottom: 8, textAlign: "center" }}>{BRAND.name}</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 12, textAlign: "center", maxWidth: 280, lineHeight: 1.6, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>{BRAND.slogan}</p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, textAlign: "center", maxWidth: 300, lineHeight: 1.6, marginTop: 12 }}>Sistema integral de gestion de servicios tecnicos y soporte al cliente.</p>

        <div className="auth-side-demo" style={{ marginTop: 40, background: "rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", maxWidth: 280 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Cuentas demo</p>
          {[["Asesor", "asesor@futurapp.com", "123456"], ["Admin", "admin@tech.com", "admin123"], ["Tecnico", "tec@tech.com", "tec123"], ["Usuario", "user@tech.com", "user123"]].map(([role, email, password]) => (
            <div key={role} style={{ marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}><strong style={{ color: "rgba(255,255,255,0.6)" }}>{role}:</strong> {email} / {password}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-panel" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, minWidth: 360, overflowY: "auto" }}>
        <div style={{ width: "calc(100vw - 72px)", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{title}</h2>
          <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 28 }}>{subtitle}</p>

          {isForgot && (
            <>
              <Field label="Correo electronico" type="email" value={forgotEmail} onChange={setForgotEmail} req placeholder="correo@ejemplo.com" />
              {forgotMessage && <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{forgotMessage}</p>}
              {canShowDevResetLink && devResetLink && (
                <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10, marginBottom: 14, color: "var(--text2)", fontSize: 12, wordBreak: "break-all" }}>
                  <strong style={{ color: "var(--text)" }}>Modo desarrollo:</strong> {devResetLink}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <BtnPrimary onClick={submitForgotPassword} disabled={saving}>{saving ? "Enviando..." : "Enviar instrucciones"}</BtnPrimary>
                <BtnGhost onClick={goLogin}>Volver</BtnGhost>
              </div>
            </>
          )}

          {isReset && (
            <>
              {!resetToken && <p style={{ color: "#C84B31", fontSize: 13, marginBottom: 12 }}>El enlace de recuperacion no es valido o expiro.</p>}
              <Field label="Nueva contrasena" type="password" value={resetForm.password} onChange={value => setResetForm(current => ({ ...current, password: value }))} req />
              <Field label="Confirmar contrasena" type="password" value={resetForm.confirmPassword} onChange={value => setResetForm(current => ({ ...current, confirmPassword: value }))} req />
              {resetMessage && <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{resetMessage}</p>}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <BtnPrimary onClick={submitResetPassword} disabled={saving || !resetToken}>{saving ? "Guardando..." : "Cambiar contrasena"}</BtnPrimary>
                <BtnGhost onClick={goLogin}>Ir a iniciar sesion</BtnGhost>
              </div>
            </>
          )}

          {!isForgot && !isReset && isReg && (
            <>
              <Grid2>
                <Field label="Nombre" value={regF.nombre} onChange={setR("nombre")} req />
                <Field label="Apellido" value={regF.apellido} onChange={setR("apellido")} />
              </Grid2>
              <Field label="Telefono" value={regF.telefono} onChange={setR("telefono")} placeholder="Ej: 3001234567" />
            </>
          )}

          {!isForgot && !isReset && (
            <>
              <Field label="Correo electronico" type="email" value={isReg ? regF.correo : loginF.correo} onChange={isReg ? setR("correo") : setL("correo")} req placeholder="correo@ejemplo.com" />
              <Field label="Contrasena" type="password" value={isReg ? regF.password : loginF.password} onChange={isReg ? setR("password") : setL("password")} req />
              {isReg && <Field label="Confirmar contrasena" type="password" value={regF.confirm} onChange={setR("confirm")} req />}
            </>
          )}

          {!isForgot && !isReset && <BtnPrimary onClick={isReg ? doRegister : doLogin}>{isReg ? "Crear cuenta" : "Iniciar sesion"}</BtnPrimary>}

          {!isForgot && !isReset && !isReg && (
            <p style={{ marginTop: 12, fontSize: 13, color: "var(--text3)", textAlign: "center" }}>
              <button onClick={() => setScreen("forgot-password")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-body)", textDecoration: "underline" }}>
                Olvido su contrasena?
              </button>
            </p>
          )}

          {!isForgot && !isReset && <p style={{ marginTop: 18, fontSize: 14, color: "var(--text3)", textAlign: "center" }}>
            {isReg ? "Ya tienes cuenta?" : "No tienes cuenta?"}
            {" "}
            <button onClick={() => setScreen(isReg ? "login" : "register")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)", textDecoration: "underline" }}>
              {isReg ? "Inicia sesion" : "Registrate"}
            </button>
          </p>}
        </div>
      </div>
    </div>
  );
}
