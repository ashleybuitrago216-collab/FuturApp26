import { useEffect, useMemo, useState } from "react";
import { BtnGhost, BtnPrimary } from "../ui/Button";
import { inputSt } from "../ui/fieldStyles";
import { advisoriesApi } from "../../domains/advisories/services/advisoriesApi";
import { normalizeAdvisoryMessageFromApi, normalizeAdvisoryMessagesFromApi } from "../../domains/advisories/services/advisoryMappers";

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function AdvisoryChat({ advisory, currentUserId, flash }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const advisoryId = advisory?.id;
  const canUseChat = Boolean(advisoryId && advisory?.asesorId && advisory?.usuarioId);
  const charactersLeft = 1000 - draft.length;

  const loadMessages = async ({ silent = false } = {}) => {
    if (!advisoryId || !canUseChat) return;
    try {
      if (!silent) setLoading(true);
      setError("");
      const response = await advisoriesApi.getAdvisoryMessages(advisoryId);
      setMessages(normalizeAdvisoryMessagesFromApi(response));
    } catch (loadError) {
      setError(loadError?.message || "No se pudo cargar el chat.");
      flash?.(loadError?.message || "No se pudo cargar el chat.", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadInitialMessages() {
      if (!advisoryId || !canUseChat) return;
      await Promise.resolve();
      if (!active) return;

      try {
        setLoading(true);
        setError("");
        const response = await advisoriesApi.getAdvisoryMessages(advisoryId);
        if (active) setMessages(normalizeAdvisoryMessagesFromApi(response));
      } catch (loadError) {
        if (!active) return;
        setError(loadError?.message || "No se pudo cargar el chat.");
        flash?.(loadError?.message || "No se pudo cargar el chat.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialMessages();

    return () => {
      active = false;
    };
  }, [advisoryId, canUseChat, flash]);

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")) || a.id - b.id),
    [messages],
  );

  const submit = async event => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    if (message.length > 1000) {
      setError("El mensaje no puede superar 1000 caracteres.");
      return;
    }

    try {
      setSending(true);
      setError("");
      const response = await advisoriesApi.sendAdvisoryMessage(advisoryId, { message });
      const created = normalizeAdvisoryMessageFromApi(response.chatMessage || response.mensaje);
      setMessages(current => [...current, created]);
      setDraft("");
    } catch (sendError) {
      setError(sendError?.message || "No se pudo enviar el mensaje.");
      flash?.(sendError?.message || "No se pudo enviar el mensaje.", "error");
    } finally {
      setSending(false);
    }
  };

  if (!canUseChat) {
    return (
      <section style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "var(--surface2)", color: "var(--text2)", fontSize: 14 }}>
        El chat estara disponible cuando la asesoria tenga un asesor asignado.
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div>
          <strong style={{ color: "var(--text)", fontSize: 14 }}>Chat de asesoria</strong>
          <p style={{ margin: "3px 0 0", color: "var(--text3)", fontSize: 12 }}>Historial guardado para el usuario y el asesor asignado.</p>
        </div>
        <BtnGhost icon="reply" onClick={() => loadMessages({ silent: true })}>Actualizar</BtnGhost>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", minHeight: 240, maxHeight: 320, overflowY: "auto", padding: 12 }}>
        {loading && <p style={{ margin: 0, color: "var(--text3)", fontSize: 13 }}>Cargando mensajes...</p>}
        {!loading && sortedMessages.length === 0 && <p style={{ margin: 0, color: "var(--text3)", fontSize: 13 }}>Aun no hay mensajes en esta asesoria.</p>}
        {!loading && sortedMessages.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {sortedMessages.map(message => {
              const isMine = Number(message.senderId) === Number(currentUserId);
              return (
                <article key={message.id} style={{ display: "grid", justifyItems: isMine ? "end" : "start" }}>
                  <div style={{ maxWidth: "82%", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px", background: isMine ? "var(--text)" : "var(--surface)", color: isMine ? "var(--bg)" : "var(--text)" }}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 14, lineHeight: 1.45 }}>{message.message}</p>
                  </div>
                  <span style={{ marginTop: 4, color: "var(--text3)", fontSize: 11 }}>
                    {isMine ? "Tu" : message.sender?.name || "Participante"} · {formatMessageTime(message.createdAt)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <textarea
          value={draft}
          onChange={event => setDraft(event.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Escribe un mensaje"
          disabled={sending}
          style={{ ...inputSt, resize: "vertical", minHeight: 82, marginBottom: 0 }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ color: charactersLeft < 80 ? "#DC2626" : "var(--text3)", fontSize: 12 }}>{charactersLeft} caracteres disponibles</span>
          <BtnPrimary icon="chat" disabled={sending || !draft.trim()}>{sending ? "Enviando..." : "Enviar mensaje"}</BtnPrimary>
        </div>
        {error && <p style={{ margin: 0, color: "#DC2626", fontSize: 13 }}>{error}</p>}
      </form>
    </section>
  );
}
