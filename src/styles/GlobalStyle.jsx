import { useEffect } from "react";

export const GlobalStyle = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --color-bg-main: #0F172A;
        --color-primary: #1D4ED8;
        --color-primary-soft: #2563EB;
        --color-primary-deep: #1E40AF;
        --color-surface: #111827;
        --color-surface-soft: #172033;
        --color-text-main: #FFFFFF;
        --color-text-muted: #BFC5CE;
        --color-gray-light: #E5E7EB;
        --bg: #0F172A;
        --surface: #111827;
        --surface2: #172033;
        --border: #263348;
        --accent: #1D4ED8;
        --accent2: #0F766E;
        --accent3: #2563EB;
        --text: #FFFFFF;
        --text2: #E5E7EB;
        --text3: #BFC5CE;
        --shadow: 0 2px 12px rgba(0,0,0,0.22);
        --shadow-lg: 0 8px 40px rgba(0,0,0,0.32);
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
      .row-hover:hover { background: #172033 !important; }
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
      .app-main { min-width: 0; }
      .brand-logo-login { width: 220px; height: 220px; max-width: 70vw; }
      .brand-logo-sidebar, .brand-logo-header { width: 48px; height: 48px; }
      .table-frame { max-width: 100%; }
      .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .table-scroll table { min-width: max-content; }

      @media (max-width: 1023px) {
        .app-sidebar { width: 204px !important; }
        .app-main { padding: 24px !important; }
        .responsive-grid-2 { grid-template-columns: 1fr !important; }
        .payment-summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .payments-dashboard-grid { grid-template-columns: 1fr !important; }
        .payment-modal-grid { grid-template-columns: 1fr !important; }
        .technician-payment-card { grid-template-columns: 1fr !important; }
        .auth-side, .auth-form-panel { padding: 30px !important; }
      }

      @media (max-width: 767px) {
        body { min-width: 0; }
        .app-shell {
          display: block !important;
          min-height: 100vh;
          height: auto !important;
          overflow: visible !important;
        }
        .app-sidebar {
          position: sticky;
          top: 0;
          z-index: 20;
          width: 100% !important;
          max-height: none;
          overflow: hidden !important;
          border-right: none !important;
          border-bottom: 1px solid var(--border);
        }
        .app-brand { padding: 12px 16px 10px !important; }
        .app-brand-logo, .brand-logo-sidebar { width: 46px !important; height: 46px !important; }
        .app-nav {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 8px 12px !important;
          border-bottom: 1px solid var(--border);
          scrollbar-width: none;
        }
        .app-nav::-webkit-scrollbar { display: none; }
        .app-nav .nav-btn {
          flex: 0 0 auto;
          width: auto !important;
          margin-bottom: 0 !important;
          padding: 9px 11px !important;
        }
        .app-account {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 8px 12px !important;
          border-top: none !important;
        }
        .app-user-card { flex: 1; margin-bottom: 0 !important; padding: 7px 10px !important; }
        .app-logout {
          width: auto !important;
          flex-shrink: 0;
          padding: 9px !important;
        }
        .app-logout-label { display: none; }
        .app-main {
          overflow: visible !important;
          padding: 20px 16px 24px !important;
        }
        .page-head { margin-bottom: 18px !important; }
        .page-head > div { width: 100%; }
        .page-head-action, .page-head-action > button { width: 100%; }
        .auth-page { display: block !important; }
        .auth-side {
          min-width: 0 !important;
          padding: 28px 20px !important;
        }
        .auth-side > p, .auth-side-demo { display: none; }
        .auth-side-logo, .brand-logo-login { width: 150px !important; height: 150px !important; margin-bottom: 10px !important; }
        .auth-side-title { margin-bottom: 0 !important; font-size: 27px !important; }
        .auth-form-panel {
          min-width: 0 !important;
          width: 100% !important;
          max-width: 100vw !important;
          align-items: flex-start !important;
          padding: 26px 18px !important;
          overflow: visible !important;
        }
        .auth-form-panel > div {
          width: calc(100vw - 36px) !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }
        .responsive-grid-2, .fields-grid-2 { grid-template-columns: 1fr !important; }
        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
        .payment-summary-grid { grid-template-columns: 1fr !important; }
        .payment-summary-card { padding: 14px !important; }
        .payment-list-item { grid-template-columns: 1fr !important; align-items: stretch !important; }
        .payment-list-item > div:last-child { align-items: flex-start !important; }
        .payment-list-item button { width: 100%; justify-content: center; }
        .stat-card { padding: 14px !important; gap: 10px !important; }
        .stat-card-value { font-size: 22px !important; }
        .panel-card { padding: 16px !important; }
        .form-actions, .comment-response { flex-direction: column; }
        .form-actions > button, .comment-response > button { justify-content: center; width: 100%; }
        .modal-overlay { padding: 8px !important; align-items: flex-end !important; }
        .modal-card { max-height: 94vh !important; border-radius: 14px 14px 0 0 !important; }
        .modal-head { padding: 15px 16px !important; }
        .modal-body { padding: 16px !important; }
        .table-frame { border-radius: 10px !important; }
        .table-scroll td, .table-scroll th { padding-left: 12px !important; padding-right: 12px !important; }
        .notification-item { align-items: flex-start !important; padding: 12px !important; gap: 10px !important; }
        .receipt-row { gap: 8px; flex-wrap: wrap; }
        .receipt-row span:last-child { text-align: right; margin-left: auto; }
        .toast { left: 12px !important; right: 12px !important; bottom: 12px !important; max-width: none !important; }
      }

      @media (max-width: 420px) {
        .stats-grid { grid-template-columns: 1fr !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};
