export const Toast = ({ toast }) => {
  if (!toast) return null;
  const isErr = toast.type === "error";
  return (
    <div className="toast slide-in" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: isErr ? "#FEF2F2" : "#ECFDF5", border: `1.5px solid ${isErr ? "#FECACA" : "#BBF7D0"}`, color: isErr ? "#991B1B" : "#065F46", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-lg)", maxWidth: 340 }}>
      {toast.msg}
    </div>
  );
};
