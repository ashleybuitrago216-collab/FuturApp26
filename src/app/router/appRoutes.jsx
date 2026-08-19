import { Dashboard } from "../../pages/DashboardPage";
import { UsersRoute } from "../../domains/users/routes/UsersRoute";
import { ServicesRoute } from "../../domains/services/routes/ServicesRoute";
import { AppointmentsRoute } from "../../domains/appointments/routes/AppointmentsRoute";
import { PaymentsRoute } from "../../domains/payments/routes/PaymentsRoute";
import { CommentsRoute } from "../../domains/comments/routes/CommentsRoute";
import { NotificationsRoute } from "../../domains/notifications/routes/NotificationsRoute";
import { ReportsRoute } from "../../domains/reports/routes/ReportsRoute";
import { HelpRoute } from "../../domains/help/routes/HelpRoute";
import { ProfileRoute } from "../../domains/users/routes/ProfileRoute";
import { AsesoriasPage } from "../../pages/AsesoriasPage";
import { UsuarioAsesoriaPage } from "../../pages/UsuarioAsesoriaPage";
import { AdminAsesoriasPage } from "../../pages/AdminAsesoriasPage";

const ALL_ROLES = ["admin", "tecnico", "usuario", "asesor"];
const OPERATIVE_ROLES = ["admin", "tecnico", "usuario"];

export const appRoutes = [
  { id: "dashboard", label: "Inicio", icon: "home", roles: ALL_ROLES, Component: Dashboard },
  { id: "perfil", label: "Mi perfil", icon: "users", roles: ALL_ROLES, Component: ProfileRoute },
  { id: "usuarios", label: "Usuarios", icon: "users", roles: ["admin"], Component: UsersRoute },
  { id: "servicios", label: "Servicios", icon: "tool", roles: OPERATIVE_ROLES, Component: ServicesRoute },
  { id: "asesorias-admin", label: "Asesorias", icon: "chat", roles: ["admin"], Component: AdminAsesoriasPage },
  { id: "asesoria", label: "Asesoria", icon: "chat", roles: ["usuario"], Component: UsuarioAsesoriaPage },
  { id: "citas", label: "Citas", icon: "cal", roles: OPERATIVE_ROLES, Component: AppointmentsRoute },
  { id: "pagos", label: "Pagos", icon: "pay", roles: OPERATIVE_ROLES, Component: PaymentsRoute },
  { id: "asesorias", label: "Mis asesorias", icon: "chat", roles: ["asesor"], Component: AsesoriasPage },
  { id: "comentarios", label: "Resenas", icon: "chat", roles: ALL_ROLES, Component: CommentsRoute },
  { id: "notificaciones", label: "Notificaciones", icon: "bell", roles: ALL_ROLES, Component: NotificationsRoute },
  { id: "informes", label: "Reportes", icon: "chart", roles: ["admin", "tecnico", "usuario"], Component: ReportsRoute },
  { id: "ayuda", label: "Ayuda", icon: "help", roles: ALL_ROLES, Component: HelpRoute },
];

export const getVisibleRoutes = (session) =>
  appRoutes.filter((route) => route.roles?.includes(session?.rol));

export const getRouteById = (id, session) => {
  const visibleRoutes = getVisibleRoutes(session);
  const route = visibleRoutes.find((item) => item.id === id) || visibleRoutes[0] || appRoutes[0];
  if (session?.rol === "asesor" && route.advisorComponent) {
    return { ...route, Component: route.advisorComponent };
  }
  return route;
};
