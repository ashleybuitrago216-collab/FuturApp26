-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-05-2026 a las 15:30:27
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `futurapp`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `areas_especialidad`
--

CREATE TABLE `areas_especialidad` (
  `id_area` int(11) NOT NULL,
  `nombre_area` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `areas_especialidad`
--

INSERT INTO `areas_especialidad` (`id_area`, `nombre_area`) VALUES
(3, 'Hardware'),
(2, 'Redes'),
(4, 'Software'),
(1, 'Soporte General');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asesoria`
--

CREATE TABLE `asesoria` (
  `id_asesora` int(11) NOT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `id_area` int(11) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `id_comentario` int(11) DEFAULT NULL,
  `id_notificacion` int(11) DEFAULT NULL,
  `datos_usuario` varchar(50) DEFAULT NULL,
  `tipo_asesoria` varchar(50) DEFAULT NULL,
  `decripcion_problema` varchar(500) DEFAULT NULL,
  `area_especialidad` varchar(50) DEFAULT NULL,
  `comentarios` varchar(200) DEFAULT NULL,
  `medio_notificacion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `citas`
--

CREATE TABLE `citas` (
  `id_cita` int(11) NOT NULL,
  `id_solicitud` int(11) DEFAULT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `confirmada` tinyint(1) DEFAULT 0,
  `id_estado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `citas`
--

INSERT INTO `citas` (`id_cita`, `id_solicitud`, `id_usrs`, `fecha`, `hora`, `confirmada`, `id_estado`) VALUES
(1, 1, 1, '2025-11-25', '10:00:00', 1, 2),
(2, 3, 1, '2025-11-26', '14:30:00', 0, 2),
(3, 2, 3, '2025-11-21', '09:00:00', 1, 4),
(4, 5, 1, '2025-11-20', '16:00:00', 1, 2),
(5, 4, 5, '2025-11-28', '11:00:00', 0, 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios`
--

CREATE TABLE `comentarios` (
  `id_comentario` int(11) NOT NULL,
  `id_cita` int(11) DEFAULT NULL,
  `fecha_comentario` datetime DEFAULT current_timestamp(),
  `id_usrs` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `comentarios`
--

INSERT INTO `comentarios` (`id_comentario`, `id_cita`, `fecha_comentario`, `id_usrs`) VALUES
(1, 3, '2026-04-27 09:32:26', NULL),
(2, 1, '2026-04-27 09:32:26', NULL),
(3, 4, '2026-04-27 09:32:26', NULL),
(4, 2, '2026-04-27 09:32:26', NULL),
(5, 3, '2026-04-27 09:32:26', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `fecha_contratacion` date DEFAULT NULL,
  `salario` decimal(10,2) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `id_area` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`id`, `nombre`, `fecha_contratacion`, `salario`, `telefono`, `id_area`) VALUES
(1, 'Sara Gomez', '2023-01-10', 2000000.00, NULL, NULL),
(2, 'Juan Diaz', '2024-05-15', 1500000.00, NULL, NULL),
(3, 'Laura Tellez', '0000-00-00', 1980000.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipos`
--

CREATE TABLE `equipos` (
  `id_equipo` varchar(25) NOT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `tipo_equipo` varchar(100) DEFAULT NULL,
  `marca_equipo` varchar(100) DEFAULT NULL,
  `modelo_equipo` varchar(100) DEFAULT NULL,
  `numero_serie` varchar(50) DEFAULT NULL,
  `sistema_operativo` varchar(100) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `id_estado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `equipos`
--

INSERT INTO `equipos` (`id_equipo`, `id_usrs`, `tipo_equipo`, `marca_equipo`, `modelo_equipo`, `numero_serie`, `sistema_operativo`, `fecha_registro`, `id_estado`) VALUES
('EQ001-A', 1, 'Portátil', 'Dell', 'Inspiron 15', 'S/N-DELL001', 'Windows 10', '2026-04-27 09:32:26', 1),
('EQ002-B', 1, 'PC de Escritorio', 'HP', 'ProDesk 400', 'S/N-HP002', 'Windows 11', '2026-04-27 09:32:26', 1),
('EQ003-P', 3, 'Smartphone', 'Samsung', 'Galaxy S21', 'S/N-SAM003', 'Android 13', '2026-04-27 09:32:26', 1),
('EQ004-M', 5, 'Tablet', 'Apple', 'iPad Air (4ta Gen)', 'S/N-APL004', 'iOS 16', '2026-04-27 09:32:26', 2),
('EQ005-A', 1, 'Impresora', 'Epson', 'EcoTank L3150', 'S/N-EPS005', NULL, '2026-04-27 09:32:26', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados`
--

CREATE TABLE `estados` (
  `id_estado` int(11) NOT NULL,
  `nombre_estado` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estados`
--

INSERT INTO `estados` (`id_estado`, `nombre_estado`) VALUES
(1, 'Activo'),
(5, 'Cancelado'),
(3, 'En Progreso'),
(4, 'Finalizado'),
(2, 'Pendiente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_pago`
--

CREATE TABLE `estado_pago` (
  `id_estado` int(11) NOT NULL,
  `nombre_estado` varchar(30) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_pago`
--

INSERT INTO `estado_pago` (`id_estado`, `nombre_estado`, `descripcion`) VALUES
(1, 'Pendiente de Pago', 'Esperando confirmación de la transacción.'),
(2, 'Pagado', 'El pago se ha completado exitosamente.'),
(3, 'Fallido', 'La transacción de pago no se pudo completar.'),
(4, 'Reembolsado', 'El monto total del pago fue devuelto.'),
(5, 'En Revisión', 'El pago está siendo verificado manualmente.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medios_pago`
--

CREATE TABLE `medios_pago` (
  `id_medio` int(11) NOT NULL,
  `nombre_medio` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `medios_pago`
--

INSERT INTO `medios_pago` (`id_medio`, `nombre_medio`) VALUES
(5, 'Criptomonedas'),
(3, 'Pago en Efectivo'),
(4, 'PayPal'),
(1, 'Tarjeta de Crédito'),
(2, 'Transferencia Bancaria');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `id_tipo_notif` int(11) DEFAULT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `mensaje` text DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `fecha_envio` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `id_usrs`, `id_tipo_notif`, `titulo`, `mensaje`, `leida`, `fecha_envio`) VALUES
(1, 1, 1, 'Solicitud Recibida', 'Su solicitud #1 ha sido recibida con éxito.', 1, '2026-04-27 09:32:26'),
(2, 3, 2, 'Cita Confirmada', 'Su cita para la solicitud #2 está confirmada.', 0, '2026-04-27 09:32:26'),
(3, 1, 4, 'Recordatorio de Cita', 'Tiene una cita mañana a las 10:00 AM.', 0, '2026-04-27 09:32:26'),
(4, 5, 1, 'Solicitud Recibida', 'Su solicitud #4 ha sido recibida.', 1, '2026-04-27 09:32:26'),
(5, 1, 3, 'Pago Registrado', 'Hemos recibido el pago de su servicio #2.', 1, '2026-04-27 09:32:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

CREATE TABLE `pagos` (
  `id_pago` int(11) NOT NULL,
  `id_cita` int(11) DEFAULT NULL,
  `id_medio` int(11) DEFAULT NULL,
  `id_estado_pago` int(11) DEFAULT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `fecha_pago` datetime DEFAULT current_timestamp(),
  `detalle_comprobante` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos`
--

INSERT INTO `pagos` (`id_pago`, `id_cita`, `id_medio`, `id_estado_pago`, `id_usrs`, `monto`, `fecha_pago`, `detalle_comprobante`) VALUES
(1, 3, 1, 2, 3, 120.00, '2026-04-27 09:32:26', 'Ref: TRJ-00123456'),
(2, 3, 2, 2, 3, 75.00, '2026-04-27 09:32:26', 'Ref: BAN-98765432'),
(3, 1, 3, 1, 1, 45.00, '2026-04-27 09:32:26', 'Pendiente efectivo a la llegada'),
(4, 5, 1, 3, 5, 30.00, '2026-04-27 09:32:26', 'Pago fallido con tarjeta'),
(5, 2, 2, 4, 1, 75.00, '2026-04-27 09:32:26', 'Reembolso por cancelación de servicio');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prioridades`
--

CREATE TABLE `prioridades` (
  `id_prioridad` int(11) NOT NULL,
  `nombre_prioridad` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `prioridades`
--

INSERT INTO `prioridades` (`id_prioridad`, `nombre_prioridad`) VALUES
(3, 'Alta'),
(1, 'Baja'),
(5, 'Crítica'),
(2, 'Media'),
(4, 'Urgente');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `respuestas_comentarios`
--

CREATE TABLE `respuestas_comentarios` (
  `id_respuesta` int(11) NOT NULL,
  `id_comentario` int(11) DEFAULT NULL,
  `id_respondedor` int(11) DEFAULT NULL,
  `texto_respuesta` text DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `respuestas_comentarios`
--

INSERT INTO `respuestas_comentarios` (`id_respuesta`, `id_comentario`, `id_respondedor`, `texto_respuesta`, `fecha_respuesta`) VALUES
(1, 1, 4, 'Gracias por su retroalimentación, nos alegra saberlo.', '2026-04-27 09:32:26'),
(2, 2, 2, 'El técnico asignado es Luis Martínez. Le contactará pronto.', '2026-04-27 09:32:26'),
(3, 3, 4, 'Haremos lo posible para finalizar hoy. Le notificaremos.', '2026-04-27 09:32:26'),
(4, 4, 4, 'Revisaremos el sistema de recordatorios, disculpe la molestia.', '2026-04-27 09:32:26'),
(5, 5, 2, '¡A usted por confiar en nuestros servicios!', '2026-04-27 09:32:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'Administrador'),
(3, 'Cliente'),
(4, 'Soporte'),
(2, 'Técnico'),
(5, 'Visitante');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes_servicio`
--

CREATE TABLE `solicitudes_servicio` (
  `id_solicitud` int(11) NOT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `id_equipo` varchar(25) DEFAULT NULL,
  `id_tp_servicio` int(11) DEFAULT NULL,
  `descripcion_problema` varchar(255) DEFAULT NULL,
  `id_prioridad` int(11) DEFAULT NULL,
  `fecha_solicitud` datetime DEFAULT current_timestamp(),
  `id_estado` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitudes_servicio`
--

INSERT INTO `solicitudes_servicio` (`id_solicitud`, `id_usrs`, `id_equipo`, `id_tp_servicio`, `descripcion_problema`, `id_prioridad`, `fecha_solicitud`, `id_estado`) VALUES
(1, 1, 'EQ001-A', 1, 'El portátil está lento, requiere limpieza de hardware.', 3, '2026-04-27 09:32:26', 2),
(2, 3, 'EQ003-P', 4, 'Pantalla rota tras una caída. Necesita reparación urgente.', 4, '2026-04-27 09:32:26', 3),
(3, 1, 'EQ002-B', 2, 'Deseo cambiar de Windows 11 a Linux Ubuntu.', 2, '2026-04-27 09:32:26', 2),
(4, 5, 'EQ004-M', 5, 'El touch del tablet a veces no responde.', 1, '2026-04-27 09:32:26', 2),
(5, 1, 'EQ005-A', 3, 'La impresora no se conecta a la red Wi-Fi.', 3, '2026-04-27 09:32:26', 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_documento`
--

CREATE TABLE `tipos_documento` (
  `id_tipo_doc` int(11) NOT NULL,
  `nombre_tipo` varchar(50) DEFAULT NULL,
  `tipo_abreviado` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_documento`
--

INSERT INTO `tipos_documento` (`id_tipo_doc`, `nombre_tipo`, `tipo_abreviado`) VALUES
(1, 'Cédula de Ciudadanía', 'CC'),
(2, 'Tarjeta de Identidad', 'TI'),
(3, 'Cédula de Extranjería', 'CE'),
(4, 'Pasaporte', 'PAS'),
(5, 'Documento de Identidad', 'DNI');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_notificacion`
--

CREATE TABLE `tipos_notificacion` (
  `id_tipo_notif` int(11) NOT NULL,
  `nombre_tipo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_notificacion`
--

INSERT INTO `tipos_notificacion` (`id_tipo_notif`, `nombre_tipo`) VALUES
(2, 'Cita Confirmada'),
(5, 'Comentario Nuevo'),
(3, 'Pago Recibido'),
(4, 'Recordatorio de Cita'),
(1, 'Solicitud Creada');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tp_servicios`
--

CREATE TABLE `tp_servicios` (
  `id_tp_servicio` int(11) NOT NULL,
  `nombre_servicio` varchar(150) DEFAULT NULL,
  `desc_servicio` varchar(225) DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tp_servicios`
--

INSERT INTO `tp_servicios` (`id_tp_servicio`, `nombre_servicio`, `desc_servicio`, `costo`) VALUES
(1, 'Mantenimiento Preventivo PC', 'Limpieza interna, optimización de software.', 45.00),
(2, 'Instalación de SO', 'Formateo e instalación de Windows/Linux.', 75.00),
(3, 'Revisión de Red Doméstica', 'Diagnóstico y configuración de router/Wi-Fi.', 50.00),
(4, 'Reparación de Pantalla Móvil', 'Reemplazo de pantalla en smartphone o tablet.', 120.00),
(5, 'Asistencia Remota', 'Soporte técnico por internet para problemas leves.', 30.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicaciones_tecnicos`
--

CREATE TABLE `ubicaciones_tecnicos` (
  `id_ubicacion` int(11) NOT NULL,
  `id_usrs` int(11) DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ubicaciones_tecnicos`
--

INSERT INTO `ubicaciones_tecnicos` (`id_ubicacion`, `id_usrs`, `latitud`, `longitud`, `fecha_registro`) VALUES
(1, 2, 4.71100000, -74.07210000, '2026-04-27 09:32:26'),
(2, 2, 4.71150000, -74.07250000, '2026-04-27 09:32:26'),
(3, 2, 4.60980000, -74.08170000, '2026-04-27 09:32:26'),
(4, 2, 4.62890000, -74.06380000, '2026-04-27 09:32:26'),
(5, 2, 4.69000000, -74.07500000, '2026-04-27 09:32:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usrs`
--

CREATE TABLE `usrs` (
  `id_usrs` int(11) NOT NULL,
  `id_tp_doc` int(11) DEFAULT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellido` varchar(100) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `clave` varchar(255) DEFAULT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `direccion` varchar(100) DEFAULT NULL,
  `id_area` int(11) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `id_rol` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usrs`
--

INSERT INTO `usrs` (`id_usrs`, `id_tp_doc`, `nombre`, `apellido`, `correo`, `clave`, `telefono`, `direccion`, `id_area`, `fecha_registro`, `id_rol`, `activo`) VALUES
(1, 1, 'Ana', 'García', 'ana.garcia@email.com', 'claveAna', '3001234567', 'Calle 10 # 1-1A', NULL, '2026-04-27 09:32:25', 3, 1),
(2, 1, 'Luis', 'Martínez', 'luis.martinez@email.com', 'claveLuis', '3017654321', 'Avenida 5 # 2B-2C', 3, '2026-04-27 09:32:25', 2, 1),
(3, 4, 'Pedro', 'López', 'pedro.lopez@email.com', 'clavePedro', '3025556677', 'Carrera 8 # 3-3D', NULL, '2026-04-27 09:32:25', 3, 1),
(4, 1, 'Sofía', 'Rodríguez', 'sofia.rodri@email.com', 'claveSofia', '3034445588', 'Transversal 12 # 4-4E', 1, '2026-04-27 09:32:25', 1, 1),
(5, 3, 'María', 'Fernández', 'maria.f@email.com', 'claveMaria', '3049991122', 'Diagonal 15 # 5F-6G', NULL, '2026-04-27 09:32:25', 3, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `areas_especialidad`
--
ALTER TABLE `areas_especialidad`
  ADD PRIMARY KEY (`id_area`),
  ADD UNIQUE KEY `nombre_area` (`nombre_area`);

--
-- Indices de la tabla `asesoria`
--
ALTER TABLE `asesoria`
  ADD PRIMARY KEY (`id_asesora`),
  ADD KEY `id_usrs` (`id_usrs`),
  ADD KEY `id_area` (`id_area`),
  ADD KEY `id` (`id`),
  ADD KEY `id_comentario` (`id_comentario`),
  ADD KEY `id_notificacion` (`id_notificacion`);

--
-- Indices de la tabla `citas`
--
ALTER TABLE `citas`
  ADD PRIMARY KEY (`id_cita`),
  ADD KEY `id_solicitud` (`id_solicitud`),
  ADD KEY `id_usrs` (`id_usrs`),
  ADD KEY `id_estado` (`id_estado`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id_comentario`),
  ADD KEY `id_cita` (`id_cita`),
  ADD KEY `usrs_fk` (`id_usrs`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empleados_area` (`id_area`);

--
-- Indices de la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`id_equipo`),
  ADD UNIQUE KEY `numero_serie` (`numero_serie`),
  ADD KEY `id_usrs` (`id_usrs`),
  ADD KEY `id_estado` (`id_estado`);

--
-- Indices de la tabla `estados`
--
ALTER TABLE `estados`
  ADD PRIMARY KEY (`id_estado`),
  ADD UNIQUE KEY `nombre_estado` (`nombre_estado`);

--
-- Indices de la tabla `estado_pago`
--
ALTER TABLE `estado_pago`
  ADD PRIMARY KEY (`id_estado`);

--
-- Indices de la tabla `medios_pago`
--
ALTER TABLE `medios_pago`
  ADD PRIMARY KEY (`id_medio`),
  ADD UNIQUE KEY `nombre_medio` (`nombre_medio`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `id_usrs` (`id_usrs`),
  ADD KEY `id_tipo_notif` (`id_tipo_notif`);

--
-- Indices de la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_cita` (`id_cita`),
  ADD KEY `id_medio` (`id_medio`),
  ADD KEY `id_estado_pago` (`id_estado_pago`),
  ADD KEY `id_usrs` (`id_usrs`);

--
-- Indices de la tabla `prioridades`
--
ALTER TABLE `prioridades`
  ADD PRIMARY KEY (`id_prioridad`),
  ADD UNIQUE KEY `nombre_prioridad` (`nombre_prioridad`);

--
-- Indices de la tabla `respuestas_comentarios`
--
ALTER TABLE `respuestas_comentarios`
  ADD PRIMARY KEY (`id_respuesta`),
  ADD KEY `id_comentario` (`id_comentario`),
  ADD KEY `id_respondedor` (`id_respondedor`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`);

--
-- Indices de la tabla `solicitudes_servicio`
--
ALTER TABLE `solicitudes_servicio`
  ADD PRIMARY KEY (`id_solicitud`),
  ADD KEY `id_usrs` (`id_usrs`),
  ADD KEY `id_equipo` (`id_equipo`),
  ADD KEY `id_tp_servicio` (`id_tp_servicio`),
  ADD KEY `id_prioridad` (`id_prioridad`),
  ADD KEY `id_estado` (`id_estado`);

--
-- Indices de la tabla `tipos_documento`
--
ALTER TABLE `tipos_documento`
  ADD PRIMARY KEY (`id_tipo_doc`),
  ADD UNIQUE KEY `nombre_tipo` (`nombre_tipo`),
  ADD UNIQUE KEY `tipo_abreviado` (`tipo_abreviado`);

--
-- Indices de la tabla `tipos_notificacion`
--
ALTER TABLE `tipos_notificacion`
  ADD PRIMARY KEY (`id_tipo_notif`),
  ADD UNIQUE KEY `nombre_tipo` (`nombre_tipo`);

--
-- Indices de la tabla `tp_servicios`
--
ALTER TABLE `tp_servicios`
  ADD PRIMARY KEY (`id_tp_servicio`);

--
-- Indices de la tabla `ubicaciones_tecnicos`
--
ALTER TABLE `ubicaciones_tecnicos`
  ADD PRIMARY KEY (`id_ubicacion`),
  ADD KEY `id_usrs` (`id_usrs`);

--
-- Indices de la tabla `usrs`
--
ALTER TABLE `usrs`
  ADD PRIMARY KEY (`id_usrs`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD KEY `id_tp_doc` (`id_tp_doc`),
  ADD KEY `id_area` (`id_area`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `areas_especialidad`
--
ALTER TABLE `areas_especialidad`
  MODIFY `id_area` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `asesoria`
--
ALTER TABLE `asesoria`
  MODIFY `id_asesora` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `citas`
--
ALTER TABLE `citas`
  MODIFY `id_cita` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id_comentario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `estados`
--
ALTER TABLE `estados`
  MODIFY `id_estado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `estado_pago`
--
ALTER TABLE `estado_pago`
  MODIFY `id_estado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `medios_pago`
--
ALTER TABLE `medios_pago`
  MODIFY `id_medio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pagos`
--
ALTER TABLE `pagos`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `prioridades`
--
ALTER TABLE `prioridades`
  MODIFY `id_prioridad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `respuestas_comentarios`
--
ALTER TABLE `respuestas_comentarios`
  MODIFY `id_respuesta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `solicitudes_servicio`
--
ALTER TABLE `solicitudes_servicio`
  MODIFY `id_solicitud` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `tipos_documento`
--
ALTER TABLE `tipos_documento`
  MODIFY `id_tipo_doc` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `tipos_notificacion`
--
ALTER TABLE `tipos_notificacion`
  MODIFY `id_tipo_notif` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `tp_servicios`
--
ALTER TABLE `tp_servicios`
  MODIFY `id_tp_servicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `ubicaciones_tecnicos`
--
ALTER TABLE `ubicaciones_tecnicos`
  MODIFY `id_ubicacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `usrs`
--
ALTER TABLE `usrs`
  MODIFY `id_usrs` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `asesoria`
--
ALTER TABLE `asesoria`
  ADD CONSTRAINT `asesoria_ibfk_1` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`),
  ADD CONSTRAINT `asesoria_ibfk_2` FOREIGN KEY (`id_area`) REFERENCES `areas_especialidad` (`id_area`),
  ADD CONSTRAINT `asesoria_ibfk_3` FOREIGN KEY (`id`) REFERENCES `empleados` (`id`),
  ADD CONSTRAINT `asesoria_ibfk_4` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  ADD CONSTRAINT `asesoria_ibfk_5` FOREIGN KEY (`id_notificacion`) REFERENCES `notificaciones` (`id_notificacion`);

--
-- Filtros para la tabla `citas`
--
ALTER TABLE `citas`
  ADD CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes_servicio` (`id_solicitud`),
  ADD CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`),
  ADD CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`);

--
-- Filtros para la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`),
  ADD CONSTRAINT `usrs_fk` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`);

--
-- Filtros para la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_area` FOREIGN KEY (`id_area`) REFERENCES `areas_especialidad` (`id_area`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `equipos`
--
ALTER TABLE `equipos`
  ADD CONSTRAINT `equipos_ibfk_1` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`),
  ADD CONSTRAINT `equipos_ibfk_2` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`);

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`),
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`id_tipo_notif`) REFERENCES `tipos_notificacion` (`id_tipo_notif`);

--
-- Filtros para la tabla `pagos`
--
ALTER TABLE `pagos`
  ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`),
  ADD CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`id_medio`) REFERENCES `medios_pago` (`id_medio`),
  ADD CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`id_estado_pago`) REFERENCES `estado_pago` (`id_estado`),
  ADD CONSTRAINT `pagos_ibfk_4` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`);

--
-- Filtros para la tabla `respuestas_comentarios`
--
ALTER TABLE `respuestas_comentarios`
  ADD CONSTRAINT `respuestas_comentarios_ibfk_1` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios` (`id_comentario`),
  ADD CONSTRAINT `respuestas_comentarios_ibfk_2` FOREIGN KEY (`id_respondedor`) REFERENCES `usrs` (`id_usrs`);

--
-- Filtros para la tabla `solicitudes_servicio`
--
ALTER TABLE `solicitudes_servicio`
  ADD CONSTRAINT `solicitudes_servicio_ibfk_1` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`),
  ADD CONSTRAINT `solicitudes_servicio_ibfk_2` FOREIGN KEY (`id_equipo`) REFERENCES `equipos` (`id_equipo`),
  ADD CONSTRAINT `solicitudes_servicio_ibfk_3` FOREIGN KEY (`id_tp_servicio`) REFERENCES `tp_servicios` (`id_tp_servicio`),
  ADD CONSTRAINT `solicitudes_servicio_ibfk_4` FOREIGN KEY (`id_prioridad`) REFERENCES `prioridades` (`id_prioridad`),
  ADD CONSTRAINT `solicitudes_servicio_ibfk_5` FOREIGN KEY (`id_estado`) REFERENCES `estados` (`id_estado`);

--
-- Filtros para la tabla `ubicaciones_tecnicos`
--
ALTER TABLE `ubicaciones_tecnicos`
  ADD CONSTRAINT `ubicaciones_tecnicos_ibfk_1` FOREIGN KEY (`id_usrs`) REFERENCES `usrs` (`id_usrs`);

--
-- Filtros para la tabla `usrs`
--
ALTER TABLE `usrs`
  ADD CONSTRAINT `usrs_ibfk_1` FOREIGN KEY (`id_tp_doc`) REFERENCES `tipos_documento` (`id_tipo_doc`),
  ADD CONSTRAINT `usrs_ibfk_2` FOREIGN KEY (`id_area`) REFERENCES `areas_especialidad` (`id_area`),
  ADD CONSTRAINT `usrs_ibfk_3` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
