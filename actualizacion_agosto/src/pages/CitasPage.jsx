import { useEffect, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Table } from "../components/tables/Table";
import { Modal } from "../components/modals/Modal";
import { BtnGhost, BtnPrimary, IconBtn } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Field } from "../components/ui/Field";
import { appointmentsApi } from "../domains/appointments/services/appointmentsApi";
import { mapScheduleToApiPayload, normalizeAppointmentFromApi } from "../domains/appointments/services/appointmentMappers";
import { hoy } from "../utils/helpers";

const APPOINTMENT_STATUSES = ["Pendiente", "Programada", "Completada", "Cancelada"];

export function CitasModule({ isAdmin, isTecnico, flash }) {
  const [modal, setModal] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ fecha: hoy(), hora: "09:00" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const setSchedule = key => value => setScheduleForm(current => ({ ...current, [key]: value }));

  const canViewContact = isAdmin || isTecnico;
  const canManageAppointments = isAdmin;

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const response = await appointmentsApi.getAppointments();
      setAppointments(response.map(normalizeAppointmentFromApi));
    } catch (error) {
      setLoadError(error.message || "No se pudieron cargar las citas.");
      flash(error.message || "No se pudieron cargar las citas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Citas migro a API: la carga inicial depende del JWT ya restaurado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasSchedule = appointment => Boolean(appointment.fechaHora || (appointment.fecha && appointment.hora));
  const getUser = person => person?.name || "Sin asignar";
  const getServiceLabel = appointment => appointment.servicio || appointment.service?.serviceType || "Servicio asociado";

  const openSchedule = appointment => {
    setScheduleTarget(appointment);
    setScheduleForm({ fecha: appointment.fecha || hoy(), hora: appointment.hora || "09:00" });
    setModal("schedule");
  };

  const saveSchedule = async () => {
    if (!scheduleTarget) return;
    if (!scheduleForm.fecha || !scheduleForm.hora) return flash("Complete fecha y hora.", "error");

    try {
      setSaving(true);
      await appointmentsApi.scheduleAppointment(scheduleTarget.id, mapScheduleToApiPayload(scheduleForm));
      flash("Cita programada. Notificacion enviada al tecnico.");
      setModal(null);
      setScheduleTarget(null);
      await loadAppointments();
    } catch (error) {
      flash(error.message || "No se pudo programar la cita.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cambiar = async (id, estado) => {
    if (!APPOINTMENT_STATUSES.includes(estado)) return;
    try {
      await appointmentsApi.updateAppointmentStatus(id, { status: estado });
      flash("Estado actualizado.");
      await loadAppointments();
    } catch (error) {
      flash(error.message || "No se pudo actualizar el estado.", "error");
    }
  };

  const tableHeaders = canManageAppointments
    ? ["#", "Cliente", "Servicio", "Descripcion", "Fecha", "Hora", "Contacto", "Tecnico asignado", "Estado", "Acciones"]
    : canViewContact
      ? ["#", "Cliente", "Servicio", "Descripcion", "Fecha", "Hora", "Contacto", "Tecnico asignado", "Estado"]
      : ["#", "Cliente", "Servicio", "Descripcion", "Fecha", "Hora", "Tecnico asignado", "Estado"];

  return (
    <div>
      <PageHead title="Gestion de Citas" sub="RF009 - RF012 - Agendamiento, solicitud y seguimiento de citas" />
      {loading && <p style={{ color: "var(--text3)", marginBottom: 12 }}>Cargando citas...</p>}
      {loadError && <p style={{ color: "#DC2626", marginBottom: 12 }}>{loadError}</p>}
      <Table
        headers={tableHeaders}
        rows={appointments.map(appointment => {
          const baseRow = [
            <span style={{ color: "var(--text3)", fontSize: 12 }}>#{appointment.id}</span>,
            getUser(appointment.client),
            getServiceLabel(appointment),
            appointment.descripcionProblema || "Sin descripcion",
            appointment.fecha || "Pendiente",
            appointment.hora || "Pendiente",
            appointment.contacto || "Sin contacto",
            getUser(appointment.technician),
            <Badge label={appointment.estado || "Pendiente"} />,
            <div style={{ display: "flex", gap: 6 }}>
              {isAdmin && <IconBtn icon="edit" title={hasSchedule(appointment) ? "Modificar fecha y hora" : "Programar cita"} onClick={() => openSchedule(appointment)} />}
              {isAdmin && appointment.estado !== "Completada" && <IconBtn icon="check" title="Marcar completada" onClick={() => cambiar(appointment.id, "Completada")} color="#2C6E49" />}
              {isAdmin && appointment.estado !== "Cancelada" && <IconBtn icon="x" title="Cancelar" onClick={() => cambiar(appointment.id, "Cancelada")} color="#C84B31" />}
            </div>,
          ];

          if (canManageAppointments) return baseRow;
          if (canViewContact) return baseRow.slice(0, 9);
          return [baseRow[0], baseRow[1], baseRow[2], baseRow[3], baseRow[4], baseRow[5], baseRow[7], baseRow[8]];
        })}
      />
      {canManageAppointments && modal === "schedule" && scheduleTarget && (
        <Modal title="Programar cita" onClose={() => { setModal(null); setScheduleTarget(null); }}>
          <Field label="Fecha" type="date" value={scheduleForm.fecha} onChange={setSchedule("fecha")} req />
          <Field label="Hora" type="time" value={scheduleForm.hora} onChange={setSchedule("hora")} req />
          <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>El admin programa la cita sin definir monto. El valor queda pendiente para una fase posterior.</p>
          <div className="form-actions" style={{ display: "flex", gap: 10 }}>
            <BtnPrimary onClick={saveSchedule} icon="check">{saving ? "Guardando..." : "Guardar programacion"}</BtnPrimary>
            <BtnGhost onClick={() => { setModal(null); setScheduleTarget(null); }}>Cancelar</BtnGhost>
          </div>
        </Modal>
      )}
    </div>
  );
}
