import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui/PageHead";
import { Modal } from "../components/modals/Modal";
import { BtnGhost, BtnPrimary } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Ic } from "../components/ui/Icon";
import { inputSt } from "../components/ui/fieldStyles";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_METHODS, PAYMENT_STATUSES } from "../domains/payments/model/paymentsModel";
import { normalizePaymentFromApi } from "../domains/payments/services/paymentMappers";
import { paymentsApi } from "../domains/payments/services/paymentsApi";
import { cop } from "../utils/helpers";

const panelStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 18,
  boxShadow: "var(--shadow)",
};

const methodAccent = {
  Efectivo: "#2C6E49",
  Bancolombia: "#D97706",
  Nequi: "#2563EB",
  DaviPlata: "#C84B31",
};

function getDate(payment) {
  const value = payment.paidAt || payment.confirmedAt || payment.fecha;
  if (!value) return "Fecha pendiente";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getReference(payment) {
  return payment.txId || payment.reference || `TXN-${String(payment.id).padStart(6, "0")}`;
}

function SummaryCard({ label, value, detail, icon, accent }) {
  return (
    <div className="payment-summary-card card-hover" style={{ ...panelStyle, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}18`, color: accent, flexShrink: 0 }}>
        <Ic n={icon} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--text3)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
        <div style={{ color: "var(--text)", fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, overflowWrap: "anywhere" }}>{value}</div>
        <div style={{ color: "var(--text2)", fontSize: 12 }}>{detail}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, strong = false, danger = false }) {
  return (
    <div className="receipt-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ color: "var(--text3)", fontSize: 13 }}>{label}</span>
      <span style={{ color: danger ? "#C84B31" : "var(--text)", fontWeight: strong ? 800 : 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function EmptyState({ text }) {
  return <p style={{ color: "var(--text3)", fontSize: 13, textAlign: "center", padding: "24px 10px" }}>{text}</p>;
}

function PaymentMethodCard({ method, selected, onClick, compact = false }) {
  const accent = methodAccent[method.name] || "var(--text)";
  return (
    <button type="button" onClick={onClick} style={{ width: "100%", textAlign: "left", background: selected ? `${accent}12` : "var(--surface)", border: `1.5px solid ${selected ? accent : "var(--border)"}`, borderRadius: 10, padding: compact ? 12 : 14, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ width: 36, height: 36, borderRadius: 9, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${accent}18`, color: accent, flexShrink: 0 }}>
        <Ic n={method.name === PAYMENT_METHODS.CASH ? "home" : "pay"} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>{method.name}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--text3)" }}>{method.description}</span>
      </span>
      {selected && <span style={{ marginLeft: "auto", color: accent }}><Ic n="check" /></span>}
    </button>
  );
}

function PaymentCard({ payment, actionLabel, onAction, showTechnician = true }) {
  const hasReview = payment.requiresAdminReview;
  const hasValidAmount = Number(payment.valor || 0) > 0;
  const paymentAvailable = hasValidAmount && payment.canPay !== false;
  return (
    <div className="payment-list-item" style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, display: "grid", gridTemplateColumns: actionLabel ? "1fr auto auto" : "1fr auto", gap: 12, alignItems: "center" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{payment.servicio}</div>
        <div style={{ color: "var(--text3)", fontSize: 12, marginBottom: 3 }}>{getReference(payment)}</div>
        <div style={{ color: "var(--text2)", fontSize: 13 }}>{getDate(payment)}</div>
        <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>Cliente: {payment.clientName}</div>
        {showTechnician && <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>Tecnico: {payment.technicianName}</div>}
        <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>Metodo usuario: {payment.userPaymentMethod || "Pendiente"}</div>
        {payment.technicianPaymentMethod && <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>Metodo tecnico: {payment.technicianPaymentMethod}</div>}
        {payment.confirmationAttempts > 0 && <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 3 }}>Intentos tecnico: {payment.confirmationAttempts}</div>}
        {payment.adminObservation && <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 3 }}>{payment.adminObservation}</div>}
        {payment.paymentBlockedReason && <div style={{ color: "#B45309", fontSize: 12, marginTop: 5 }}>{payment.paymentBlockedReason}</div>}
        {hasReview && <div style={{ color: "#B45309", fontSize: 12, fontWeight: 800, marginTop: 5 }}>! Revision requerida</div>}
      </div>
      <Badge label={payment.estado} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
        <strong style={{ color: "var(--text)", fontSize: 16 }}>{hasValidAmount ? cop(payment.valor) : "Valor pendiente por definir"}</strong>
        {actionLabel && paymentAvailable && <BtnPrimary small icon="pay" onClick={() => onAction(payment)}>{actionLabel}</BtnPrimary>}
      </div>
    </div>
  );
}

function usePayments(flash) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, summaryResponse] = await Promise.all([
        paymentsApi.getPayments(),
        paymentsApi.getPaymentsSummary(),
      ]);
      setPayments(paymentsResponse.map(normalizePaymentFromApi));
      setSummary(summaryResponse);
    } catch (error) {
      flash(error.message || "No se pudieron cargar los pagos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Pagos migro a API: carga inicial con JWT restaurado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { payments, summary, loading, loadPayments };
}

function UserPayments({ flash }) {
  const { payments, summary, loading, loadPayments } = usePayments(flash);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [target, setTarget] = useState(null);
  const [modalMethod, setModalMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const pending = payments.filter(payment => payment.estado === PAYMENT_STATUSES.PENDING && Number(payment.valor || 0) > 0);
  const withoutAmount = payments.filter(payment => payment.estado === PAYMENT_STATUSES.PENDING && Number(payment.valor || 0) <= 0);
  const history = payments.filter(payment => payment.estado !== PAYMENT_STATUSES.PENDING);

  const openPayment = payment => {
    setTarget(payment);
    setModalMethod(selectedMethod || payment.method || "");
  };

  const confirmPayment = async () => {
    if (!target || !modalMethod) return;
    try {
      setProcessing(true);
      await paymentsApi.initiatePayment(target.id, { method: modalMethod });
      flash(modalMethod === PAYMENT_METHODS.CASH ? "Metodo en efectivo registrado." : "Pago registrado correctamente.");
      setSelectedMethod(modalMethod);
      setTarget(null);
      await loadPayments();
    } catch (error) {
      flash(error.message || "No se pudo procesar el pago.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <PageHead title="Pagos" sub="Inicio / Pagos" />
      {loading && <p style={{ color: "var(--text3)", marginBottom: 12 }}>Cargando pagos...</p>}
      <div className="payment-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        <SummaryCard label="Total a pagar" value={cop(summary.totalToPay || 0)} detail={`${summary.pendingPayments || 0} pagos pendientes`} icon="pay" accent="#D97706" />
        <SummaryCard label="Pagados" value={summary.paidPayments || 0} detail="Pagos procesados" icon="check" accent="#2C6E49" />
        <SummaryCard label="Gastado total" value={cop(summary.spentTotal || 0)} detail="Historico pagado" icon="chart" accent="#2563EB" />
        <SummaryCard label="Metodos usados" value={new Set(payments.map(payment => payment.method).filter(Boolean)).size} detail="Registrados" icon="shield" accent="#C84B31" />
      </div>
      <div className="payments-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.86fr) minmax(0, 1.35fr)", gap: 18, alignItems: "start" }}>
        <section style={panelStyle}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Metodos de pago disponibles</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {PAYMENT_METHOD_OPTIONS.map(method => <PaymentMethodCard key={method.name} method={method} selected={selectedMethod === method.name} onClick={() => setSelectedMethod(method.name)} />)}
          </div>
        </section>
        <div style={{ display: "grid", gap: 14 }}>
          <section style={panelStyle}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Pagos pendientes</h3>
            <div style={{ display: "grid", gap: 10 }}>{pending.length ? pending.map(payment => <PaymentCard key={payment.id} payment={payment} actionLabel="Pagar" onAction={openPayment} />) : <EmptyState text="No tienes pagos pendientes." />}</div>
            {withoutAmount.length > 0 && <p style={{ margin: "10px 0 0", color: "var(--text3)", fontSize: 12 }}>Hay servicios con valor pendiente por definir. El pago se habilitara cuando exista un monto valido.</p>}
          </section>
          <section style={panelStyle}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Historial reciente</h3>
            <div style={{ display: "grid", gap: 10 }}>{history.length ? history.map(payment => <PaymentCard key={payment.id} payment={payment} />) : <EmptyState text="Aun no tienes pagos procesados." />}</div>
          </section>
        </div>
      </div>
      {target && (
        <Modal title="Resumen del Servicio" onClose={() => setTarget(null)} wide>
          <div className="payment-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.95fr", gap: 18 }}>
            <section style={{ ...panelStyle, boxShadow: "none" }}>
              <DetailRow label="Servicio:" value={target.servicio} />
              <DetailRow label="Tecnico:" value={target.technicianName} />
              <DetailRow label="Fecha:" value={getDate(target)} />
              <DetailRow label="Total a pagar:" value={cop(target.valor)} strong />
            </section>
            <section>
              <h4 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Metodo de pago</h4>
              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>{PAYMENT_METHOD_OPTIONS.map(method => <PaymentMethodCard key={method.name} method={method} compact selected={modalMethod === method.name} onClick={() => setModalMethod(method.name)} />)}</div>
              <div className="form-actions" style={{ display: "flex", gap: 10 }}>
                <BtnPrimary onClick={confirmPayment} icon="pay">{processing ? "Procesando..." : `Pagar ${cop(target.valor)}`}</BtnPrimary>
                <BtnGhost onClick={() => setTarget(null)}>Cancelar</BtnGhost>
              </div>
              <p style={{ color: "var(--text3)", fontSize: 12, marginTop: 10 }}>La verificacion del tecnico quedara pendiente despues del pago.</p>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TechnicianPayments({ flash }) {
  const { payments, summary, loading, loadPayments } = usePayments(flash);
  const [target, setTarget] = useState(null);
  const [method, setMethod] = useState("");
  const [warning, setWarning] = useState(null);
  const [processing, setProcessing] = useState(false);
  const pending = payments.filter(payment => payment.estado === PAYMENT_STATUSES.PAID && !payment.confirmedByTechnician);
  const confirmed = payments.filter(payment => payment.estado === PAYMENT_STATUSES.PAID && payment.confirmedByTechnician);

  const confirm = async () => {
    if (!target || !method) return;
    try {
      setProcessing(true);
      const response = await paymentsApi.confirmTechnicianPayment(target.id, { method });
      flash(response?.requiresAdminReview ? "Pago confirmado con observacion para admin." : "Pago confirmado correctamente.");
      setWarning(null);
      setTarget(null);
      await loadPayments();
    } catch (error) {
      if (error.status === 409 && error.payload?.code === "PAYMENT_METHOD_MISMATCH") {
        setWarning(error.payload);
        flash(error.message || "El metodo no coincide. Revisa nuevamente.", "error");
        return;
      }
      flash(error.message || "No se pudo confirmar el pago.", "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <PageHead title="Pagos" sub="Inicio / Pagos tecnico" />
      {loading && <p style={{ color: "var(--text3)", marginBottom: 12 }}>Cargando pagos...</p>}
      <div className="payment-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        <SummaryCard label="Por confirmar" value={pending.length} detail="Servicios completados" icon="pay" accent="#D97706" />
        <SummaryCard label="Ganancia pendiente" value={cop(summary.pendingEarnings || 0)} detail="Pendiente" icon="chart" accent="#2563EB" />
        <SummaryCard label="Confirmados" value={confirmed.length} detail="Pagos recibidos" icon="check" accent="#2C6E49" />
        <SummaryCard label="Ganancia registrada" value={cop(summary.confirmedEarnings || 0)} detail="Pagos confirmados" icon="shield" accent="#C84B31" />
      </div>
      <section style={panelStyle}>
        <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>Pagos de servicios completados</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {[...pending, ...confirmed].map(payment => <PaymentCard key={payment.id} payment={payment} actionLabel={payment.estado === PAYMENT_STATUSES.PAID && payment.confirmedByTechnician ? "" : "Confirmar"} onAction={(item) => { setTarget(item); setMethod(item.userPaymentMethod || item.method || ""); setWarning(null); }} showTechnician={false} />)}
          {payments.length === 0 && <EmptyState text="No hay pagos asociados a tus servicios." />}
        </div>
      </section>
      {target && (
        <Modal title="Confirmar pago recibido" onClose={() => setTarget(null)} wide>
          <div className="payment-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 0.95fr", gap: 18 }}>
            <section style={{ ...panelStyle, boxShadow: "none" }}>
              <DetailRow label="Cliente:" value={target.clientName} />
              <DetailRow label="Servicio:" value={target.servicio} />
              <DetailRow label="Total:" value={cop(target.valor)} />
              <DetailRow label="Comision:" value={`-${cop(target.platformCommission)}`} danger />
              <DetailRow label="Tu ganancia:" value={cop(target.technicianEarnings)} strong />
              <DetailRow label="Metodo usuario:" value={target.userPaymentMethod || "Pendiente"} />
              <DetailRow label="Verificacion:" value={target.technicianVerificationStatus || "Pendiente"} />
            </section>
            <section>
              <h4 style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Como pago el cliente?</h4>
              {warning && (
                <div style={{ border: "1px solid #D97706", background: "#FFF7ED", color: "#92400E", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 13, fontWeight: 700 }}>
                  {warning.message || "El metodo indicado no coincide."} Intento {warning.attempts} de 2.
                </div>
              )}
              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>{PAYMENT_METHOD_OPTIONS.map(option => <PaymentMethodCard key={option.name} method={option} compact selected={method === option.name} onClick={() => setMethod(option.name)} />)}</div>
              <div className="form-actions" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <BtnGhost onClick={() => setTarget(null)}>Cancelar</BtnGhost>
                <BtnPrimary onClick={confirm} icon="check">{processing ? "Confirmando..." : "Confirmar Pago"}</BtnPrimary>
              </div>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminPayments({ flash }) {
  const { payments, summary, loading } = usePayments(flash);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return payments.filter(payment => {
      const statusOk = statusFilter === "all"
        || (statusFilter === "completed" && payment.estado === PAYMENT_STATUSES.PAID)
        || (statusFilter === "pending" && payment.estado === PAYMENT_STATUSES.PENDING)
        || (statusFilter === "failed" && payment.estado === PAYMENT_STATUSES.FAILED)
        || (statusFilter === "unverified" && payment.estado === PAYMENT_STATUSES.PAID && !payment.confirmedByTechnician)
        || (statusFilter === "verified" && payment.confirmedByTechnician && !payment.requiresAdminReview)
        || (statusFilter === "inconsistent" && payment.requiresAdminReview);
      if (!statusOk) return false;
      if (!normalizedQuery) return true;
      return [getReference(payment), payment.clientName, payment.technicianName, payment.servicio, payment.method, payment.technicianPaymentMethod, payment.adminObservation].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [payments, query, statusFilter]);
  const filterOptions = [
    { id: "all", label: "Todos" },
    { id: "unverified", label: "Sin verificar" },
    { id: "verified", label: "Confirmados" },
    { id: "inconsistent", label: "Con inconsistencias" },
    { id: "pending", label: "Pendientes" },
  ];

  return (
    <div>
      <PageHead title="Pagos" sub="Inicio / Pagos admin" />
      {loading && <p style={{ color: "var(--text3)", marginBottom: 12 }}>Cargando pagos...</p>}
      <div className="payment-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        <SummaryCard label="Transacciones" value={summary.totalTransactions || 0} detail="Pagos registrados" icon="pay" accent="#2563EB" />
        <SummaryCard label="Tasa de exito" value={`${Number(summary.successRate || 0).toFixed(1)}%`} detail="Pagados / total" icon="check" accent="#2C6E49" />
        <SummaryCard label="Ingresos totales" value={cop(summary.totalRevenue || 0)} detail="Pagos completados" icon="chart" accent="#D97706" />
        <SummaryCard label="Comisiones" value={cop(summary.totalCommissions || 0)} detail="Plataforma 25%" icon="shield" accent="#C84B31" />
      </div>
      <section style={{ ...panelStyle, marginBottom: 14 }}>
        <div className="admin-payments-controls" style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "center" }}>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por ID, cliente o tecnico..." style={{ ...inputSt, marginBottom: 0 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{filterOptions.map(option => <button type="button" key={option.id} onClick={() => setStatusFilter(option.id)} className="btn-ghost" style={{ border: `1.5px solid ${statusFilter === option.id ? "var(--text)" : "var(--border)"}`, background: statusFilter === option.id ? "var(--text)" : "transparent", color: statusFilter === option.id ? "var(--bg)" : "var(--text2)", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>{option.label}</button>)}</div>
        </div>
      </section>
      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800 }}>Transacciones recientes</h3>
          <span style={{ color: "var(--text3)", fontSize: 12 }}>{filtered.length} resultados</span>
        </div>
        <div style={{ display: "grid", gap: 12 }}>{filtered.length ? filtered.map(payment => <PaymentCard key={payment.id} payment={payment} />) : <EmptyState text="No hay transacciones que coincidan con la busqueda." />}</div>
      </section>
    </div>
  );
}

export function PagosModule({ session, isAdmin, flash }) {
  if (isAdmin) return <AdminPayments flash={flash} />;
  if (session.rol === "tecnico") return <TechnicianPayments flash={flash} />;
  return <UserPayments flash={flash} />;
}
