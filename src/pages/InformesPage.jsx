import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { BtnPrimary, BtnGhost } from "../components/ui/Button";
import { inputSt } from "../components/ui/fieldStyles";
import { usersApi } from "../domains/users/services/usersApi";
import { servicesApi } from "../domains/services/services/servicesApi";
import { appointmentsApi } from "../domains/appointments/services/appointmentsApi";
import { paymentsApi } from "../domains/payments/services/paymentsApi";
import { quotesApi } from "../domains/quotes/services/quotesApi";
import { advisoriesApi } from "../domains/advisories/services/advisoriesApi";
import { commentsApi } from "../domains/comments/services/commentsApi";
import { normalizeServiceFromApi } from "../domains/services/services/serviceMappers";
import { normalizeAppointmentFromApi } from "../domains/appointments/services/appointmentMappers";
import { normalizePaymentFromApi } from "../domains/payments/services/paymentMappers";
import { normalizeServiceStatus, SERVICE_STATUS } from "../domains/services/model/servicesModel";
import { cop } from "../utils/helpers";

const REPORT_TYPES = ["General", "Usuarios", "Servicios", "Citas", "Pagos", "Cotizaciones", "Asesorias", "Resenas"];
const FORMAT_TYPES = ["PDF", "Excel", "CSV"];
const PERIOD_TYPES = ["Todo", "Hoy", "Esta semana", "Este mes", "Este trimestre", "Este ano"];
const TECH_TABS = ["Hoy", "Reportes", "Historial", "Perfil"];
const USER_TABS = ["Resumen", "Pagos", "Facturas", "Actividad"];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeRole(value) {
  return String(value?.role || value?.rol || value?.nombreRol || "").trim().toLowerCase();
}

function getStatus(value) {
  return String(value?.status || value?.estado || value?.nombreEstado || "").trim();
}

function getReviewResponse(review) {
  return review?.technicianResponse || review?.respuestaTecnico || "";
}

function getReviewRating(review) {
  return toNumber(review?.rating ?? review?.calificacion);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPeriodStart(period) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "Hoy") return start;
  if (period === "Esta semana") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return start;
  }
  if (period === "Este mes") {
    start.setDate(1);
    return start;
  }
  if (period === "Este trimestre") {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
    return start;
  }
  if (period === "Este ano") {
    start.setMonth(0, 1);
    return start;
  }

  return null;
}

function filterByPeriod(items, period, getDate) {
  const start = getPeriodStart(period);
  if (!start) return items;

  return items.filter(item => {
    const date = parseDate(getDate(item));
    return date && date >= start;
  });
}

function buildCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = value => {
    const text = value == null ? "" : String(value);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    headers.join(";"),
    ...rows.map(row => headers.map(header => escape(row[header])).join(";")),
  ].join("\n");
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeReportCell(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeHtml(value) {
  return normalizeReportCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildExcelHtml(rows) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const headerCells = headers.map(header => `<th>${escapeHtml(header)}</th>`).join("");
  const bodyRows = rows.map(row => (
    `<tr>${headers.map(header => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`
  )).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; }
    th, td { border: 1px solid #C7D2FE; padding: 6px 8px; }
    th { background: #DBEAFE; font-weight: bold; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

function downloadExcelFile(filename, rows) {
  downloadTextFile(filename, buildExcelHtml(rows), "application/vnd.ms-excel;charset=utf-8");
}

async function downloadPdfFile(filename, title, rows) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (height = 24) => {
    if (y + height <= pageHeight - margin) return;
    doc.addPage();
    y = margin;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, margin, y);
  y += 24;

  rows.forEach((row, index) => {
    addPageIfNeeded(48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Registro ${index + 1}`, margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    Object.entries(row).forEach(([key, value]) => {
      const line = `${key}: ${normalizeReportCell(value)}`;
      const lines = doc.splitTextToSize(line, contentWidth);
      addPageIfNeeded(lines.length * 12 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 12 + 4;
    });
    y += 8;
  });

  doc.save(filename);
}

async function downloadReportFile({ rows, format, filenameBase, title, flash, successLabel }) {
  if (format === "PDF") {
    await downloadPdfFile(`${filenameBase}.pdf`, title, rows);
    flash?.(`${successLabel} descargado en PDF.`);
    return;
  }

  if (format === "Excel") {
    downloadExcelFile(`${filenameBase}.xls`, rows);
    flash?.(`${successLabel} descargado en Excel.`);
    return;
  }

  downloadTextFile(`${filenameBase}.csv`, buildCsv(rows), "text/csv;charset=utf-8");
  flash?.(`${successLabel} descargado en CSV.`);
}

function StatCard({ label, value, helper }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <div style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: 26, fontWeight: 900, marginTop: 6 }}>{value}</div>
      {helper && <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>{helper}</div>}
    </div>
  );
}

function SummaryList({ title, items }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <h3 style={{ fontFamily: "var(--font-head)", color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>{title}</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
            <span style={{ color: "var(--text3)", fontSize: 13 }}>{item.label}</span>
            <span style={{ color: "var(--text)", fontSize: 13, fontWeight: 800 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTable({ title, rows }) {
  return (
    <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
      <h3 style={{ fontFamily: "var(--font-head)", color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>{title}</h3>
      {rows.length === 0 && <p style={{ margin: 0, color: "var(--text3)", fontSize: 14 }}>Sin datos disponibles.</p>}
      {rows.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.slice(0, 6).map(row => (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "minmax(160px, 1fr) repeat(2, minmax(80px, 0.5fr))", gap: 10, alignItems: "center", borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
              <span style={{ color: "var(--text)", fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span>
              <span style={{ color: "var(--text2)", fontSize: 13 }}>{row.value}</span>
              <span style={{ color: "var(--text3)", fontSize: 12 }}>{row.helper}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "var(--text3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} style={inputSt}>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function getTechnicianInitials(session) {
  const first = session?.nombre?.[0] || session?.name?.[0] || "T";
  const last = session?.apellido?.[0] || "";
  return `${first}${last}`.toUpperCase();
}

function getTechnicianName(session) {
  return `${session?.nombre || session?.name || "Tecnico"} ${session?.apellido || ""}`.trim();
}

function getSessionName(session) {
  return `${session?.nombre || session?.name || "Usuario"} ${session?.apellido || ""}`.trim();
}

function getSessionInitials(session) {
  const first = session?.nombre?.[0] || session?.name?.[0] || "U";
  const last = session?.apellido?.[0] || "";
  return `${first}${last}`.toUpperCase();
}

function isTodayValue(value) {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
}

function getServiceDateValue(service) {
  return service.createdAt || service.fecha || service.date;
}

function getAppointmentDateValue(appointment) {
  return appointment.fechaHora || appointment.fecha;
}

function getPaymentDateValue(payment) {
  return payment.paidAt || payment.fecha || payment.createdAt;
}

function getQuoteDateValue(quote) {
  return quote.createdAt || quote.fechaCreacion || quote.fecha_creacion;
}

function getReviewDateValue(review) {
  return review.createdAt || review.fechaResena;
}

function TechShell({ children }) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", color: "#EAF2FF" }}>
      {children}
    </div>
  );
}

function TechCard({ children, style }) {
  return (
    <div style={{
      background: "#0F1B2E",
      border: "1px solid rgba(96, 165, 250, 0.18)",
      borderRadius: 18,
      boxShadow: "0 18px 42px rgba(4, 10, 21, 0.22)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function TechMetric({ label, value, helper }) {
  return (
    <TechCard style={{ padding: 16 }}>
      <div style={{ color: "#8EA6C7", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 900, marginTop: 5 }}>{value}</div>
      {helper && <div style={{ color: "#8EA6C7", fontSize: 12, marginTop: 4 }}>{helper}</div>}
    </TechCard>
  );
}

function TechTabs({ active, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, margin: "14px 0 18px" }}>
      {TECH_TABS.map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          style={{
            border: "1px solid rgba(96, 165, 250, 0.18)",
            borderRadius: 999,
            background: active === tab ? "#2563EB" : "#111D31",
            color: active === tab ? "#FFFFFF" : "#AFC2DE",
            padding: "10px 8px",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function TechList({ title, emptyText, items, renderItem }) {
  return (
    <TechCard style={{ padding: 16 }}>
      <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 900, color: "#FFFFFF", margin: "0 0 12px" }}>{title}</h3>
      {items.length === 0 && <p style={{ color: "#8EA6C7", fontSize: 14, margin: 0 }}>{emptyText}</p>}
      {items.length > 0 && (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map(renderItem)}
        </div>
      )}
    </TechCard>
  );
}

function TechRow({ title, meta, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#13223A", borderRadius: 14, padding: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ color: "#8EA6C7", fontSize: 12, marginTop: 3 }}>{meta}</div>
      </div>
      {value && <div style={{ color: "#60A5FA", fontSize: 13, fontWeight: 900, whiteSpace: "nowrap" }}>{value}</div>}
    </div>
  );
}

function TechnicianReportsView({ session, datasets, period, setPeriod, format, setFormat, flash }) {
  const [tab, setTab] = useState("Hoy");
  const services = datasets.services;
  const appointments = datasets.appointments;
  const payments = datasets.payments;
  const quotes = datasets.quotes;
  const reviews = datasets.reviews;

  const todayServices = services.filter(service => isTodayValue(getServiceDateValue(service)));
  const todayAppointments = appointments.filter(appointment => isTodayValue(getAppointmentDateValue(appointment)));
  const completed = services.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.completed);
  const pending = services.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.pending);
  const earnings = payments.reduce((sum, payment) => sum + toNumber(payment.technicianEarnings ?? payment.amount ?? payment.valor), 0);
  const ratingAverage = reviews.length
    ? reviews.reduce((sum, review) => sum + getReviewRating(review), 0) / reviews.length
    : 0;
  const answeredReviews = reviews.filter(review => Boolean(getReviewResponse(review))).length;

  const filteredServices = filterByPeriod(services, period, getServiceDateValue);
  const filteredPayments = filterByPeriod(payments, period, getPaymentDateValue);
  const filteredQuotes = filterByPeriod(quotes, period, getQuoteDateValue);
  const filteredReviews = filterByPeriod(reviews, period, getReviewDateValue);
  const filteredEarnings = filteredPayments.reduce((sum, payment) => sum + toNumber(payment.technicianEarnings ?? payment.amount ?? payment.valor), 0);

  const reportRows = [
    { indicador: "Servicios asignados", valor: filteredServices.length },
    { indicador: "Servicios completados", valor: filteredServices.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.completed).length },
    { indicador: "Pagos relacionados", valor: filteredPayments.length },
    { indicador: "Ganancias estimadas", valor: filteredEarnings },
    { indicador: "Cotizaciones", valor: filteredQuotes.length },
    { indicador: "Resenas", valor: filteredReviews.length },
  ];

  const downloadTechnicianReport = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const safePeriod = period.toLowerCase().replace(/\s+/g, "-");
    try {
      await downloadReportFile({
        rows: reportRows,
        format,
        filenameBase: `futurapp-reporte-tecnico-${safePeriod}-${stamp}`,
        title: `Reporte tecnico - ${period}`,
        flash,
        successLabel: "Reporte tecnico",
      });
    } catch {
      flash?.("No se pudo descargar el reporte tecnico.", "error");
    }
  };

  return (
    <TechShell>
      <TechCard style={{ padding: 18, background: "linear-gradient(135deg, #0B1528 0%, #122A4E 55%, #2563EB 140%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, background: "#2563EB", color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 950, fontSize: 18, flexShrink: 0 }}>
              {getTechnicianInitials(session)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#FFFFFF", fontWeight: 950, fontSize: 19, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getTechnicianName(session)}</div>
              <div style={{ color: "#BBD0EC", fontSize: 13, marginTop: 3 }}>Tecnico - Panel personal</div>
            </div>
          </div>
          <div style={{ color: "#FFFFFF", fontWeight: 950, fontSize: 15, background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 10px" }}>
            {ratingAverage ? ratingAverage.toFixed(1) : "0.0"}/5
          </div>
        </div>
      </TechCard>

      <TechTabs active={tab} onChange={setTab} />

      {tab === "Hoy" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <TechMetric label="Hoy" value={todayAppointments.length || todayServices.length} helper="Actividades" />
            <TechMetric label="Pendientes" value={pending.length} helper="Servicios" />
            <TechMetric label="Completados" value={completed.length} helper="Historico" />
            <TechMetric label="Ganancias" value={cop(earnings)} helper="Estimadas" />
          </div>
          <TechList
            title="Agenda de hoy"
            emptyText="No tienes actividades programadas para hoy."
            items={todayAppointments.length ? todayAppointments : todayServices}
            renderItem={item => (
              <TechRow
                key={item.id}
                title={item.servicio || item.tipo || `Servicio #${item.id}`}
                meta={item.hora || item.estado || "Pendiente de horario"}
                value={item.estado}
              />
            )}
          />
        </div>
      )}

      {tab === "Reportes" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 12 }}>
            <FieldSelect label="Periodo" value={period} onChange={setPeriod} options={PERIOD_TYPES} />
            <FieldSelect label="Formato" value={format} onChange={setFormat} options={FORMAT_TYPES} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <TechMetric label="Servicios" value={filteredServices.length} />
            <TechMetric label="Pagos" value={filteredPayments.length} />
            <TechMetric label="Cotizaciones" value={filteredQuotes.length} />
            <TechMetric label="Resenas" value={filteredReviews.length} />
          </div>
          <TechCard style={{ padding: 16 }}>
            <BtnPrimary icon="down" onClick={downloadTechnicianReport}>Descargar reporte</BtnPrimary>
          </TechCard>
        </div>
      )}

      {tab === "Historial" && (
        <div style={{ display: "grid", gap: 14 }}>
          <TechList
            title="Servicios recientes"
            emptyText="Todavia no tienes servicios asignados."
            items={services.slice(0, 12)}
            renderItem={service => (
              <TechRow
                key={service.id}
                title={service.tipo || `Servicio #${service.id}`}
                meta={service.descripcion || service.fecha || "Sin descripcion"}
                value={service.estado}
              />
            )}
          />
          <TechList
            title="Pagos relacionados"
            emptyText="No hay pagos asociados."
            items={payments.slice(0, 8)}
            renderItem={payment => (
              <TechRow
                key={payment.id}
                title={payment.servicio || `Pago #${payment.id}`}
                meta={payment.status || payment.estado || "Sin estado"}
                value={cop(payment.technicianEarnings ?? payment.amount ?? payment.valor)}
              />
            )}
          />
        </div>
      )}

      {tab === "Perfil" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <TechMetric label="Calificacion" value={ratingAverage ? ratingAverage.toFixed(1) : "0.0"} helper={`${reviews.length} resenas`} />
            <TechMetric label="Respondidas" value={answeredReviews} helper="Resenas" />
            <TechMetric label="Servicios" value={services.length} helper="Asignados" />
          </div>
          <TechList
            title="Resenas recientes"
            emptyText="Aun no tienes resenas."
            items={reviews.slice(0, 8)}
            renderItem={review => (
              <TechRow
                key={review.id || review.reviewId || review.resenaId}
                title={`${getReviewRating(review) || 0}/5 - ${review.comment || review.comentario || "Sin comentario"}`}
                meta={getReviewResponse(review) ? "Respondida" : "Pendiente de respuesta"}
                value={review.serviceId || review.solicitudServicioId ? `#${review.serviceId || review.solicitudServicioId}` : ""}
              />
            )}
          />
        </div>
      )}
    </TechShell>
  );
}

function UserReportsView({ session, datasets, period, setPeriod, format, setFormat, flash }) {
  const [tab, setTab] = useState("Resumen");
  const services = datasets.services;
  const appointments = datasets.appointments;
  const payments = datasets.payments;
  const quotes = datasets.quotes;
  const advisories = datasets.advisories;
  const reviews = datasets.reviews;

  const completed = services.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.completed);
  const pending = services.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.pending);
  const paid = payments.filter(payment => String(payment.status || payment.estado || "").toLowerCase().includes("pag"));
  const pendingPayments = payments.filter(payment => String(payment.status || payment.estado || "").toLowerCase().includes("pend"));
  const totalPaid = paid.reduce((sum, payment) => sum + toNumber(payment.amount ?? payment.valor), 0);
  const filteredPayments = filterByPeriod(payments, period, getPaymentDateValue);
  const filteredAppointments = filterByPeriod(appointments, period, getAppointmentDateValue);
  const filteredQuotes = filterByPeriod(quotes, period, getQuoteDateValue);
  const filteredReviews = filterByPeriod(reviews, period, getReviewDateValue);
  const filteredActivities = [
    ...filterByPeriod(services, period, getServiceDateValue).map(item => ({
      id: `activity-${item.id}`,
      title: item.tipo || `Solicitud #${item.id}`,
      meta: item.estado || "Sin estado",
      value: item.fecha ? String(item.fecha).slice(0, 10) : "",
    })),
    ...filterByPeriod(advisories, period, item => item.createdAt || item.fechaCreacion || item.fecha || item.date).map(item => ({
      id: `advisory-${item.id || item.idAsesoria}`,
      title: item.reason || item.motivo || item.descripcion || "Asesoria",
      meta: item.status || item.estado || "Sin estado",
      value: item.fecha || item.date || "",
    })),
  ];

  const reportRows = [
    { indicador: "Solicitudes registradas", valor: services.length },
    { indicador: "Solicitudes completadas", valor: completed.length },
    { indicador: "Pagos realizados", valor: filteredPayments.length },
    { indicador: "Total pagado", valor: filteredPayments.reduce((sum, payment) => sum + toNumber(payment.amount ?? payment.valor), 0) },
    { indicador: "Citas", valor: filteredAppointments.length },
    { indicador: "Cotizaciones", valor: filteredQuotes.length },
    { indicador: "Resenas", valor: filteredReviews.length },
  ];

  const downloadUserReport = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const safePeriod = period.toLowerCase().replace(/\s+/g, "-");
    try {
      await downloadReportFile({
        rows: reportRows,
        format,
        filenameBase: `futurapp-reporte-usuario-${safePeriod}-${stamp}`,
        title: `Reporte usuario - ${period}`,
        flash,
        successLabel: "Reporte personal",
      });
    } catch {
      flash?.("No se pudo descargar el reporte personal.", "error");
    }
  };

  return (
    <TechShell>
      <TechCard style={{ padding: 18, background: "linear-gradient(135deg, #07111F 0%, #12345A 60%, #2563EB 145%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 54, height: 54, borderRadius: 18, background: "#2563EB", color: "#FFFFFF", display: "grid", placeItems: "center", fontWeight: 950, fontSize: 18, flexShrink: 0 }}>
              {getSessionInitials(session)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#FFFFFF", fontWeight: 950, fontSize: 19, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getSessionName(session)}</div>
              <div style={{ color: "#BBD0EC", fontSize: 13, marginTop: 3 }}>Cuenta personal</div>
            </div>
          </div>
          <div style={{ color: "#FFFFFF", fontWeight: 950, fontSize: 15, background: "rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 10px" }}>
            {paid.length} pagos
          </div>
        </div>
      </TechCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, margin: "14px 0 18px" }}>
        {USER_TABS.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            style={{
              border: "1px solid rgba(96, 165, 250, 0.18)",
              borderRadius: 999,
              background: tab === item ? "#2563EB" : "#111D31",
              color: tab === item ? "#FFFFFF" : "#AFC2DE",
              padding: "10px 8px",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Resumen" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <TechMetric label="Solicitudes" value={services.length} helper={`${pending.length} pendientes`} />
            <TechMetric label="Completadas" value={completed.length} helper="Finalizadas" />
            <TechMetric label="Pagado" value={cop(totalPaid)} helper={`${paid.length} pagos`} />
            <TechMetric label="Resenas" value={reviews.length} helper="Publicadas" />
          </div>
          <TechList
            title="Actividad reciente"
            emptyText="Aun no tienes actividad registrada."
            items={filteredActivities.slice(0, 8)}
            renderItem={item => (
              <TechRow key={item.id} title={item.title} meta={item.meta} value={item.value ? String(item.value).slice(0, 10) : ""} />
            )}
          />
        </div>
      )}

      {tab === "Pagos" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <TechMetric label="Realizados" value={paid.length} />
            <TechMetric label="Pendientes" value={pendingPayments.length} />
            <TechMetric label="Total" value={cop(totalPaid)} />
          </div>
          <TechList
            title="Movimientos"
            emptyText="No hay pagos registrados."
            items={payments.slice(0, 10)}
            renderItem={payment => (
              <TechRow
                key={payment.id}
                title={payment.servicio || `Pago #${payment.id}`}
                meta={payment.status || payment.estado || "Sin estado"}
                value={cop(payment.amount ?? payment.valor)}
              />
            )}
          />
        </div>
      )}

      {tab === "Facturas" && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 12 }}>
            <FieldSelect label="Periodo" value={period} onChange={setPeriod} options={PERIOD_TYPES} />
            <FieldSelect label="Formato" value={format} onChange={setFormat} options={FORMAT_TYPES} />
          </div>
          <TechList
            title="Comprobantes disponibles"
            emptyText="No hay comprobantes para mostrar."
            items={paid.slice(0, 10)}
            renderItem={payment => (
              <TechRow
                key={payment.id}
                title={payment.reference || payment.referencia || `Comprobante #${payment.id}`}
                meta={payment.fecha ? String(payment.fecha).slice(0, 10) : payment.status || payment.estado || "Pagado"}
                value={cop(payment.amount ?? payment.valor)}
              />
            )}
          />
          <TechCard style={{ padding: 16 }}>
            <BtnPrimary icon="down" onClick={downloadUserReport}>Descargar reporte</BtnPrimary>
          </TechCard>
        </div>
      )}

      {tab === "Actividad" && (
        <div style={{ display: "grid", gap: 14 }}>
          <TechList
            title="Citas"
            emptyText="No hay citas registradas."
            items={appointments.slice(0, 8)}
            renderItem={appointment => (
              <TechRow key={appointment.id} title={appointment.servicio || `Cita #${appointment.id}`} meta={appointment.estado || "Sin estado"} value={appointment.fecha || ""} />
            )}
          />
          <TechList
            title="Cotizaciones"
            emptyText="No hay cotizaciones registradas."
            items={quotes.slice(0, 8)}
            renderItem={quote => (
              <TechRow
                key={quote.id || quote.quoteId || quote.idCotizacion}
                title={quote.description || quote.descripcion || `Cotizacion #${quote.id || quote.quoteId || quote.idCotizacion}`}
                meta={quote.status || quote.estado || "Sin estado"}
                value={quote.amount || quote.monto ? cop(quote.amount || quote.monto) : ""}
              />
            )}
          />
        </div>
      )}
    </TechShell>
  );
}

export function InformesModule({ session, setTab, flash }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("General");
  const [format, setFormat] = useState("CSV");
  const [period, setPeriod] = useState("Todo");
  const [refreshKey, setRefreshKey] = useState(0);
  const [datasets, setDatasets] = useState({
    users: [],
    services: [],
    appointments: [],
    payments: [],
    quotes: [],
    advisories: [],
    reviews: [],
  });

  const isAdmin = session?.rol === "admin";
  const isTechnician = session?.rol === "tecnico";
  const isUser = session?.rol === "usuario";

  useEffect(() => {
    let active = true;

    async function loadReportData() {
      if (!isAdmin && !isTechnician && !isUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        if (isTechnician) {
          const [
            servicesResponse,
            appointmentsResponse,
            paymentsResponse,
            quotesResponse,
            reviewsResponse,
          ] = await Promise.all([
            servicesApi.getServices(),
            appointmentsApi.getAppointments(),
            paymentsApi.getPayments(),
            quotesApi.getQuotes(),
            commentsApi.listReviews(),
          ]);

          if (!active) return;
          setDatasets({
            users: [],
            services: toArray(servicesResponse).map(normalizeServiceFromApi),
            appointments: toArray(appointmentsResponse).map(normalizeAppointmentFromApi),
            payments: toArray(paymentsResponse).map(normalizePaymentFromApi),
            quotes: toArray(quotesResponse),
            advisories: [],
            reviews: toArray(reviewsResponse),
          });
          return;
        }

        if (isUser) {
          const [
            servicesResponse,
            appointmentsResponse,
            paymentsResponse,
            quotesResponse,
            advisoriesResponse,
            reviewsResponse,
          ] = await Promise.all([
            servicesApi.getServices(),
            appointmentsApi.getAppointments(),
            paymentsApi.getPayments(),
            quotesApi.getQuotes(),
            advisoriesApi.listMyAdvisories(),
            commentsApi.listReviews(),
          ]);

          if (!active) return;
          setDatasets({
            users: [],
            services: toArray(servicesResponse).map(normalizeServiceFromApi),
            appointments: toArray(appointmentsResponse).map(normalizeAppointmentFromApi),
            payments: toArray(paymentsResponse).map(normalizePaymentFromApi),
            quotes: toArray(quotesResponse),
            advisories: toArray(advisoriesResponse),
            reviews: toArray(reviewsResponse),
          });
          return;
        }

        const [
          usersResponse,
          servicesResponse,
          appointmentsResponse,
          paymentsResponse,
          quotesResponse,
          advisoriesResponse,
          reviewsResponse,
        ] = await Promise.all([
          usersApi.listUsers(),
          servicesApi.getServices(),
          appointmentsApi.getAppointments(),
          paymentsApi.getPayments(),
          quotesApi.getQuotes(),
          advisoriesApi.listMyAdvisories(),
          commentsApi.listReviews(),
        ]);

        if (!active) return;
        setDatasets({
          users: toArray(usersResponse),
          services: toArray(servicesResponse).map(normalizeServiceFromApi),
          appointments: toArray(appointmentsResponse).map(normalizeAppointmentFromApi),
          payments: toArray(paymentsResponse).map(normalizePaymentFromApi),
          quotes: toArray(quotesResponse),
          advisories: toArray(advisoriesResponse),
          reviews: toArray(reviewsResponse),
        });
      } catch (loadError) {
        if (!active) return;
        const message = loadError.message || "No se pudieron cargar los reportes.";
        setError(message);
        flash?.(message, "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReportData();

    return () => {
      active = false;
    };
  }, [flash, isAdmin, isTechnician, isUser, refreshKey]);

  const filteredDatasets = useMemo(() => ({
    users: filterByPeriod(datasets.users, period, user => user.createdAt || user.fechaRegistro || user.fecha_registro),
    services: filterByPeriod(datasets.services, period, service => service.createdAt || service.fecha || service.date),
    appointments: filterByPeriod(datasets.appointments, period, appointment => appointment.fechaHora || appointment.fecha),
    payments: filterByPeriod(datasets.payments, period, payment => payment.paidAt || payment.fecha || payment.createdAt),
    quotes: filterByPeriod(datasets.quotes, period, quote => quote.createdAt || quote.fechaCreacion || quote.fecha_creacion),
    advisories: filterByPeriod(datasets.advisories, period, advisory => advisory.createdAt || advisory.fechaCreacion || advisory.fecha || advisory.date),
    reviews: filterByPeriod(datasets.reviews, period, review => review.createdAt || review.fechaResena),
  }), [datasets, period]);

  const stats = useMemo(() => {
    const { users, services, appointments, payments, quotes, advisories, reviews } = filteredDatasets;
    const completedServices = services.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.completed);
    const pendingServices = services.filter(service => normalizeServiceStatus(service.estado) === SERVICE_STATUS.pending);
    const paidPayments = payments.filter(payment => String(payment.status || payment.estado || "").toLowerCase().includes("pag"));
    const revenue = payments.reduce((sum, payment) => sum + toNumber(payment.amount ?? payment.valor), 0);
    const reviewAverage = reviews.length
      ? reviews.reduce((sum, review) => sum + getReviewRating(review), 0) / reviews.length
      : 0;

    return {
      usersTotal: users.length,
      usersActive: users.filter(user => user.activo !== false).length,
      technicians: users.filter(user => normalizeRole(user) === "tecnico").length,
      advisors: users.filter(user => normalizeRole(user) === "asesor").length,
      servicesTotal: services.length,
      servicesCompleted: completedServices.length,
      servicesPending: pendingServices.length,
      appointmentsTotal: appointments.length,
      appointmentsConfirmed: appointments.filter(appointment => getStatus(appointment).toLowerCase().includes("confirm")).length,
      paymentsTotal: payments.length,
      paymentsPaid: paidPayments.length,
      revenue,
      quotesTotal: quotes.length,
      quotesApproved: quotes.filter(quote => getStatus(quote).toLowerCase().includes("aprob")).length,
      advisoriesTotal: advisories.length,
      advisoriesResolved: advisories.filter(advisory => getStatus(advisory).toLowerCase().includes("resuelt") || getStatus(advisory).toLowerCase().includes("final")).length,
      reviewsTotal: reviews.length,
      reviewsAnswered: reviews.filter(review => Boolean(getReviewResponse(review))).length,
      reviewAverage,
    };
  }, [filteredDatasets]);

  const serviceStatusRows = useMemo(() => {
    const byStatus = new Map();
    filteredDatasets.services.forEach(service => {
      const status = normalizeServiceStatus(service.estado);
      byStatus.set(status, (byStatus.get(status) || 0) + 1);
    });
    return [...byStatus.entries()].map(([label, value]) => ({
      label,
      value,
      helper: `${stats.servicesTotal ? Math.round((value / stats.servicesTotal) * 100) : 0}%`,
    }));
  }, [filteredDatasets.services, stats.servicesTotal]);

  const revenueRows = useMemo(() => {
    const byStatus = new Map();
    filteredDatasets.payments.forEach(payment => {
      const status = payment.status || payment.estado || "Sin estado";
      const current = byStatus.get(status) || { count: 0, amount: 0 };
      current.count += 1;
      current.amount += toNumber(payment.amount ?? payment.valor);
      byStatus.set(status, current);
    });
    return [...byStatus.entries()].map(([label, item]) => ({
      label,
      value: cop(item.amount),
      helper: `${item.count} pagos`,
    }));
  }, [filteredDatasets.payments]);

  const reviewRows = useMemo(() => {
    const byRating = new Map();
    filteredDatasets.reviews.forEach(review => {
      const rating = getReviewRating(review) || 0;
      byRating.set(rating, (byRating.get(rating) || 0) + 1);
    });
    return [...byRating.entries()].sort((a, b) => b[0] - a[0]).map(([rating, count]) => ({
      label: `${rating} estrellas`,
      value: count,
      helper: `${stats.reviewsTotal ? Math.round((count / stats.reviewsTotal) * 100) : 0}%`,
    }));
  }, [filteredDatasets.reviews, stats.reviewsTotal]);

  const reportRows = useMemo(() => {
    const { users, services, appointments, payments, quotes, advisories, reviews } = filteredDatasets;
    const mapGeneral = () => [
      { modulo: "Usuarios", total: users.length, detalle: `${stats.usersActive} activos` },
      { modulo: "Servicios", total: services.length, detalle: `${stats.servicesCompleted} completados` },
      { modulo: "Citas", total: appointments.length, detalle: `${stats.appointmentsConfirmed} confirmadas` },
      { modulo: "Pagos", total: payments.length, detalle: cop(stats.revenue) },
      { modulo: "Cotizaciones", total: quotes.length, detalle: `${stats.quotesApproved} aprobadas` },
      { modulo: "Asesorias", total: advisories.length, detalle: `${stats.advisoriesResolved} resueltas` },
      { modulo: "Resenas", total: reviews.length, detalle: `${stats.reviewsAnswered} respondidas` },
    ];

    const selected = {
      General: mapGeneral(),
      Usuarios: users.map(user => ({
        id: user.id || user.idUsuario,
        nombre: user.name || `${user.nombre || ""} ${user.apellido || ""}`.trim(),
        rol: user.role || user.rol,
        activo: user.activo !== false ? "Si" : "No",
      })),
      Servicios: services.map(service => ({
        id: service.id,
        tipo: service.tipo,
        estado: service.estado,
        usuario: service.client?.name || service.usuario?.name || service.usuarioId,
        tecnico: service.technician?.name || service.tecnico?.name || "Sin asignar",
      })),
      Citas: appointments.map(appointment => ({
        id: appointment.id,
        servicio: appointment.servicio,
        fecha: appointment.fecha,
        hora: appointment.hora,
        estado: appointment.estado,
      })),
      Pagos: payments.map(payment => ({
        id: payment.id,
        servicio: payment.servicio,
        estado: payment.status || payment.estado,
        metodo: payment.method || payment.medio,
        valor: payment.amount ?? payment.valor,
      })),
      Cotizaciones: quotes.map(quote => ({
        id: quote.id || quote.quoteId || quote.idCotizacion,
        servicio: quote.serviceId || quote.solicitudServicioId || quote.idSolicitudServicio,
        estado: quote.status || quote.estado,
        monto: quote.amount || quote.monto,
        descripcion: quote.description || quote.descripcion,
      })),
      Asesorias: advisories.map(advisory => ({
        id: advisory.id || advisory.idAsesoria,
        estado: advisory.status || advisory.estado,
        tipo: advisory.type || advisory.tipoAsesoria || advisory.tipo,
        motivo: advisory.reason || advisory.motivo || advisory.descripcion,
      })),
      Resenas: reviews.map(review => ({
        id: review.id || review.reviewId || review.resenaId,
        servicio: review.serviceId || review.solicitudServicioId || review.advisoryId || review.asesoriaId,
        calificacion: review.rating || review.calificacion,
        respondida: getReviewResponse(review) ? "Si" : "No",
        comentario: review.comment || review.comentario,
      })),
    };

    return selected[reportType] || mapGeneral();
  }, [filteredDatasets, reportType, stats]);

  const downloadReport = async () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const safeType = reportType.toLowerCase().replace(/\s+/g, "-");
    const safePeriod = period.toLowerCase().replace(/\s+/g, "-");
    try {
      await downloadReportFile({
        rows: reportRows,
        format,
        filenameBase: `futurapp-reporte-${safeType}-${safePeriod}-${stamp}`,
        title: `Reporte ${reportType} - ${period}`,
        flash,
        successLabel: `Reporte ${reportType}`,
      });
    } catch {
      flash?.(`No se pudo descargar el reporte ${reportType}.`, "error");
    }
  };

  if (!isAdmin && !isTechnician && !isUser) {
    return (
      <div>
        <PageHead title="Reportes" sub="Modulo disponible para administrador, tecnico y usuario" />
        <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
          <p style={{ color: "var(--text3)", margin: 0 }}>No tienes permisos para consultar esta vista de reportes.</p>
        </div>
      </div>
    );
  }

  if (isTechnician) {
    return (
      <div>
        <PageHead title="Reportes" sub="Panel personal del tecnico" />
        <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <BtnGhost icon="home" onClick={() => setTab?.("dashboard")}>Volver al inicio</BtnGhost>
          <BtnGhost icon="down" onClick={() => setRefreshKey(key => key + 1)}>Actualizar</BtnGhost>
        </div>

        {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando reportes...</p>}
        {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}
        {!loading && !error && (
          <TechnicianReportsView
            session={session}
            datasets={datasets}
            period={period}
            setPeriod={setPeriod}
            format={format}
            setFormat={setFormat}
            flash={flash}
          />
        )}
      </div>
    );
  }

  if (isUser) {
    return (
      <div>
        <PageHead title="Reportes" sub="Resumen personal de cuenta y pagos" />
        <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <BtnGhost icon="home" onClick={() => setTab?.("dashboard")}>Volver al inicio</BtnGhost>
          <BtnGhost icon="down" onClick={() => setRefreshKey(key => key + 1)}>Actualizar</BtnGhost>
        </div>

        {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando reportes...</p>}
        {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}
        {!loading && !error && (
          <UserReportsView
            session={session}
            datasets={datasets}
            period={period}
            setPeriod={setPeriod}
            format={format}
            setFormat={setFormat}
            flash={flash}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHead title="Reportes" sub="Estadisticas administrativas y descargas del sistema" />

      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <BtnGhost icon="home" onClick={() => setTab?.("dashboard")}>Volver al inicio</BtnGhost>
        <BtnGhost icon="down" onClick={() => setRefreshKey(key => key + 1)}>Actualizar</BtnGhost>
      </div>

      {loading && <p style={{ color: "var(--text3)", fontSize: 14 }}>Cargando reportes...</p>}
      {error && <p style={{ color: "#DC2626", fontSize: 14 }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
            <StatCard label="Usuarios" value={stats.usersTotal} helper={`${stats.usersActive} activos`} />
            <StatCard label="Servicios" value={stats.servicesTotal} helper={`${stats.servicesCompleted} completados`} />
            <StatCard label="Citas" value={stats.appointmentsTotal} helper={`${stats.appointmentsConfirmed} confirmadas`} />
            <StatCard label="Ingresos" value={cop(stats.revenue)} helper={`${stats.paymentsPaid} pagos pagados`} />
            <StatCard label="Resenas" value={stats.reviewsTotal} helper={`${stats.reviewAverage.toFixed(1)} promedio`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 14, marginBottom: 18 }}>
            <SummaryList
              title="Resumen del sistema"
              items={[
                { label: "Tecnicos registrados", value: stats.technicians },
                { label: "Asesores registrados", value: stats.advisors },
                { label: "Servicios pendientes", value: stats.servicesPending },
                { label: "Cotizaciones aprobadas", value: `${stats.quotesApproved} / ${stats.quotesTotal}` },
                { label: "Asesorias resueltas", value: `${stats.advisoriesResolved} / ${stats.advisoriesTotal}` },
                { label: "Resenas respondidas", value: `${stats.reviewsAnswered} / ${stats.reviewsTotal}` },
              ]}
            />
            <ReportTable title="Servicios por estado" rows={serviceStatusRows} />
            <ReportTable title="Pagos por estado" rows={revenueRows} />
            <ReportTable title="Resenas por calificacion" rows={reviewRows} />
          </div>

          <div className="panel-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18, marginBottom: 18 }}>
            <h3 style={{ fontFamily: "var(--font-head)", color: "var(--text)", fontSize: 16, fontWeight: 800, margin: "0 0 14px" }}>Descargar reporte</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: 14, marginBottom: 14 }}>
              <FieldSelect label="Modulo" value={reportType} onChange={setReportType} options={REPORT_TYPES} />
              <FieldSelect label="Periodo" value={period} onChange={setPeriod} options={PERIOD_TYPES} />
              <FieldSelect label="Formato" value={format} onChange={setFormat} options={FORMAT_TYPES} />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <BtnPrimary icon="down" onClick={downloadReport} disabled={reportRows.length === 0}>Descargar</BtnPrimary>
              <BtnGhost onClick={() => { setReportType("General"); setPeriod("Todo"); setFormat("CSV"); }}>Restaurar filtros</BtnGhost>
            </div>
          </div>

          <ReportTable
            title={`Vista previa - ${reportType}`}
            rows={reportRows.slice(0, 8).map((row, index) => ({
              label: row.modulo || row.nombre || row.tipo || row.servicio || `Registro ${index + 1}`,
              value: row.total ?? row.estado ?? row.valor ?? row.calificacion ?? row.rol ?? "",
              helper: row.detalle || row.fecha || row.respondida || row.motivo || "",
            }))}
          />
        </>
      )}
    </div>
  );
}
