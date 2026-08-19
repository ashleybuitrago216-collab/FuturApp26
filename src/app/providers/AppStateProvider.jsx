import { useEffect, useState } from "react";
import { seed } from "../../data/seed";
import {
  clearPersistedSession,
  loadPersistedData,
  loadPersistedSession,
  savePersistedData,
  savePersistedSession,
} from "../../infrastructure/storage/localStorageClient";

export function useAppState() {
  const [data, setData] = useState(() => loadPersistedData(seed));
  const [session, setSession] = useState(() => loadPersistedSession(null));
  const [screen, setScreen] = useState("login");
  const [tab, setTab] = useState("dashboard");
  const [regType, setRegType] = useState("usuario");
  const [toast, setToast] = useState(null);
  const [loginF, setLoginF] = useState({ correo: "", password: "" });
  const [regF, setRegF] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    password: "",
    confirm: "",
    telefono: "",
    area: "",
  });

  useEffect(() => {
    savePersistedData(data);
  }, [data]);

  useEffect(() => {
    if (session) {
      savePersistedSession(session);
      return;
    }
    clearPersistedSession();
  }, [session]);

  return {
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
  };
}
