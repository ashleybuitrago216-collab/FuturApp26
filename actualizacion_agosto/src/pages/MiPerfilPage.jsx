import { useEffect, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { BtnPrimary, BtnGhost } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Field, Grid2 } from "../components/ui/Field";
import { inputSt } from "../components/ui/fieldStyles";
import { normalizeProfileFromApi, toProfileUpdatePayload } from "../domains/profile/services/profileMappers";
import { profileApi } from "../domains/profile/services/profileApi";

const getProfileForm = profile => ({
  nombre: profile?.nombre || "",
  apellido: profile?.apellido || "",
  correo: profile?.correo || "",
  telefono: profile?.telefono || "",
  tipoDocumento: profile?.tipoDocumento || "",
  numeroDocumento: profile?.numeroDocumento || "",
  direccion: profile?.direccion || "",
  area: profile?.area || "",
  password: "",
});

function getInitials(profile) {
  return `${profile?.nombre?.[0] || "U"}${profile?.apellido?.[0] || ""}`.toUpperCase();
}

export function MiPerfilPage({ session, setSession, setTab, flash }) {
  const [profile, setProfile] = useState(session);
  const [form, setForm] = useState(() => getProfileForm(session));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await profileApi.getMyProfile();
        if (!active) return;
        const mappedProfile = normalizeProfileFromApi(response);
        setProfile(mappedProfile);
        setForm(getProfileForm(mappedProfile));
        setSession(current => ({ ...current, ...mappedProfile, rol: current.rol }));
      } catch (error) {
        if (active) flash(error?.message || "No se pudo cargar el perfil.", "error");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [flash, setSession]);

  const cancel = () => {
    setForm(getProfileForm(profile));
    flash("Cambios descartados.");
  };

  const goBack = () => {
    cancel();
    setTab?.("dashboard");
  };

  const save = async () => {
    if (!form.nombre) return flash("Nombre es obligatorio.", "error");
    if (form.password && form.password.length < 6) return flash("La contrasena debe tener al menos 6 caracteres.", "error");

    setSaving(true);

    try {
      const response = await profileApi.updateMyProfile(toProfileUpdatePayload(form));
      const mappedProfile = normalizeProfileFromApi(response);
      setProfile(mappedProfile);
      setForm(getProfileForm(mappedProfile));
      setSession(current => ({
        ...current,
        ...mappedProfile,
        correo: current.correo,
        rol: current.rol,
        activo: current.activo,
      }));
      flash("Perfil actualizado correctamente.");
    } catch (error) {
      flash(error?.message || "No se pudo actualizar el perfil.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead title="Mi perfil" sub="Actualiza la informacion de tu cuenta" />

      <div style={{ marginBottom: 16 }}>
        <BtnGhost icon="home" onClick={goBack}>Volver al inicio</BtnGhost>
      </div>

      <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24, maxWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 48, height: 48, borderRadius: 50, background: "var(--text)", color: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
            {getInitials(profile)}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 18, color: "var(--text)", marginBottom: 4 }}>{profile.nombre} {profile.apellido}</div>
            <Badge label={profile.rol} />
          </div>
        </div>

        {loading ? (
          <p style={{ color: "var(--text3)", fontSize: 14, margin: 0 }}>Cargando perfil...</p>
        ) : (
          <>
            <Grid2>
              <Field label="Nombre" value={form.nombre} onChange={set("nombre")} req />
              <Field label="Apellido" value={form.apellido} onChange={set("apellido")} />
            </Grid2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Correo</label>
              <input type="email" value={form.correo} disabled style={{ ...inputSt, opacity: 0.75, cursor: "not-allowed" }} />
            </div>
            <Field label="Telefono" value={form.telefono} onChange={set("telefono")} />
            <Grid2>
              <Field label="Tipo de documento" value={form.tipoDocumento} onChange={set("tipoDocumento")} opts={["CC", "CE", "NIT", "PASAPORTE"]} />
              <Field label="Numero de documento" value={form.numeroDocumento} onChange={set("numeroDocumento")} />
            </Grid2>
            <Field label="Direccion" value={form.direccion} onChange={set("direccion")} />
            <Field label="Contrasena nueva" type="password" value={form.password} onChange={set("password")} placeholder="Opcional" />

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Rol</label>
              <input value={profile.rol} disabled style={{ ...inputSt, opacity: 0.75, cursor: "not-allowed" }} />
            </div>

            <div className="form-actions" style={{ display: "flex", gap: 10 }}>
              <BtnPrimary onClick={save} icon="check">{saving ? "Guardando..." : "Guardar cambios"}</BtnPrimary>
              <BtnGhost onClick={cancel}>Cancelar</BtnGhost>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
