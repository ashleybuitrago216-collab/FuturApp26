import { useCallback, useEffect, useState } from "react";
import { useAppState } from "./app/providers/AppStateProvider";
import { APP_CONFIG } from "./app/config/appConfig";
import { canAccessAdminArea, canManageTechnicalWork } from "./app/config/roles";
import { AppShell } from "./app/layouts/AppShell";
import { getRouteById, getVisibleRoutes } from "./app/router/appRoutes";
import { FontLink } from "./styles/FontLink";
import { GlobalStyle } from "./styles/GlobalStyle";
import { AuthRoute } from "./domains/auth/routes/AuthRoute";
import { authApi } from "./domains/auth/services/authApi";
import { normalizeAuthUser } from "./domains/auth/services/authService";
import { authTokenStorage } from "./domains/auth/services/authTokenStorage";
import { notificationsApi } from "./domains/notifications/services/notificationsApi";
import { Toast } from "./components/ui/Toast";

export default function App() {
  const {
    data,
    setData,
    session,
    setSession,
    screen,
    setScreen,
    tab,
    setTab,
    regType,
    setRegType,
    toast,
    setToast,
    loginF,
    setLoginF,
    regF,
    setRegF,
  } = useAppState();
  const [authChecking, setAuthChecking] = useState(() => Boolean(authTokenStorage.getToken()));
  const [notificationUnread, setNotificationUnread] = useState(0);

  const syncPublicAuthScreen = useCallback(() => {
    const path = window.location.pathname;
    if (path === "/forgot-password") {
      setScreen("forgot-password");
    } else if (path === "/reset-password") {
      setScreen("reset-password");
    }
  }, [setScreen]);

  useEffect(() => {
    syncPublicAuthScreen();
    const handlePopState = () => syncPublicAuthScreen();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [syncPublicAuthScreen]);

  const setPublicScreen = useCallback((nextScreen) => {
    setScreen(nextScreen);
    const path = nextScreen === "forgot-password"
      ? "/forgot-password"
      : nextScreen === "reset-password"
        ? `/reset-password${window.location.search || ""}`
        : "/";
    window.history.pushState({}, "", path);
  }, [setScreen]);

  const flash = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }, [setToast]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = authTokenStorage.getToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }

      try {
        const response = await authApi.me();
        if (!active) return;
        setSession(normalizeAuthUser(response.user));
        setTab(APP_CONFIG.defaultTab);
      } catch {
        authTokenStorage.clearToken();
        if (active) setSession(null);
      } finally {
        if (active) setAuthChecking(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [setSession, setTab]);

  const getAuthMessage = error => {
    if (error?.status === 401) return "Credenciales invalidas.";
    if (error?.status === 409) return "El correo ya esta registrado.";
    if (error?.message === "Failed to fetch") return "No se pudo conectar con el backend.";
    return error?.message || "No se pudo completar la autenticacion.";
  };

  const isAdmin = canAccessAdminArea(session);
  const isTecnico = canManageTechnicalWork(session);

  useEffect(() => {
    let active = true;

    const loadUnreadNotifications = async () => {
      if (!session) {
        setNotificationUnread(0);
        return;
      }

      try {
        const response = await notificationsApi.getUnreadCount();
        if (active) setNotificationUnread(response.unread || 0);
      } catch {
        if (active) setNotificationUnread(0);
      }
    };

    loadUnreadNotifications();

    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const visibleRoutes = getVisibleRoutes(session);
    if (!visibleRoutes.some(route => route.id === tab)) {
      setTab(visibleRoutes[0]?.id || APP_CONFIG.defaultTab);
    }
  }, [session, setTab, tab]);

  const doLogin = async () => {
    try {
      const response = await authApi.login({ email: loginF.correo, password: loginF.password });
      authTokenStorage.setToken(response.token);
      setSession(normalizeAuthUser(response.user));
      setTab(APP_CONFIG.defaultTab);
      setLoginF({ correo: "", password: "" });
    } catch (error) {
      flash(getAuthMessage(error), "error");
    }
  };

  const doRegister = async () => {
    if (!regF.nombre || !regF.correo || !regF.password) return flash("Complete los campos obligatorios.", "error");
    if (regF.password !== regF.confirm) return flash("Las contrasenas no coinciden.", "error");

    try {
      const response = await authApi.register({
        name: `${regF.nombre} ${regF.apellido}`.trim(),
        email: regF.correo,
        password: regF.password,
        role: "usuario",
      });
      authTokenStorage.setToken(response.token);
      setSession(normalizeAuthUser(response.user));
      setTab(APP_CONFIG.defaultTab);
      setRegF({ nombre: "", apellido: "", correo: "", password: "", confirm: "", telefono: "", area: "" });
    } catch (error) {
      flash(getAuthMessage(error), "error");
    }
  };

  const doLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout remains local if the backend is unavailable.
    }
    authTokenStorage.clearToken();
    setSession(null);
    setPublicScreen("login");
  };

  if (authChecking) {
    return (
      <>
        <FontLink />
        <GlobalStyle />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", background: "var(--bg)", fontFamily: "var(--font-body)" }}>
          Restaurando sesion...
        </div>
        <Toast toast={toast} />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <FontLink />
        <GlobalStyle />
        <AuthRoute
          screen={screen}
          setScreen={setPublicScreen}
          regType={regType}
          setRegType={setRegType}
          loginF={loginF}
          setLoginF={setLoginF}
          doLogin={doLogin}
          regF={regF}
          setRegF={setRegF}
          doRegister={doRegister}
          flash={flash}
        />
        <Toast toast={toast} />
      </>
    );
  }

  const ActiveRoute = getRouteById(tab, session).Component;

  return (
    <>
      <FontLink />
      <GlobalStyle />
      <AppShell session={session} unread={notificationUnread} tab={tab} setTab={setTab} doLogout={doLogout}>
        <div className="slide-in" key={tab}>
          <ActiveRoute
            data={data}
            setData={setData}
            session={session}
            setSession={setSession}
            isAdmin={isAdmin}
            isTecnico={isTecnico}
            setTab={setTab}
            setNotificationUnread={setNotificationUnread}
            flash={flash}
          />
        </div>
      </AppShell>
      <Toast toast={toast} />
    </>
  );
}
