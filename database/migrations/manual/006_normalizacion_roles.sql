-- FuturApp - Normalizacion segura de roles oficiales
-- Roles finales de negocio:
--   Administrador -> admin
--   Tecnico       -> tecnico
--   Usuario       -> usuario
--
-- Reglas:
-- - No elimina usuarios.
-- - Migra usuarios antes de eliminar roles historicos.
-- - Soporte con area valida pasa a Tecnico.
-- - Soporte sin area pasa a Usuario.
-- - Tecnicos activos sin area reciben el area catalogada "Soporte General"
--   para cumplir la regla final de tecnico activo con area valida.

START TRANSACTION;

INSERT INTO roles (nombre_rol)
SELECT 'Administrador'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre_rol IN ('Administrador', 'Admin')
);

INSERT INTO roles (nombre_rol)
SELECT 'Tecnico'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre_rol = 'Tecnico' OR HEX(nombre_rol) = '54C3A9636E69636F'
);

INSERT INTO roles (nombre_rol)
SELECT 'Usuario'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE nombre_rol IN ('Usuario', 'Cliente', 'Visitante')
);

SET @rol_administrador := (
  SELECT id_rol
  FROM roles
  WHERE nombre_rol IN ('Administrador', 'Admin')
  ORDER BY CASE nombre_rol WHEN 'Administrador' THEN 0 WHEN 'Admin' THEN 1 ELSE 2 END, id_rol
  LIMIT 1
);

SET @rol_tecnico := (
  SELECT id_rol
  FROM roles
  WHERE nombre_rol = 'Tecnico' OR HEX(nombre_rol) = '54C3A9636E69636F'
  ORDER BY CASE WHEN nombre_rol = 'Tecnico' THEN 0 ELSE 1 END, id_rol
  LIMIT 1
);

SET @rol_usuario := (
  SELECT id_rol
  FROM roles
  WHERE nombre_rol IN ('Usuario', 'Cliente', 'Visitante')
  ORDER BY CASE nombre_rol WHEN 'Usuario' THEN 0 WHEN 'Cliente' THEN 1 WHEN 'Visitante' THEN 2 ELSE 3 END, id_rol
  LIMIT 1
);

UPDATE roles
SET nombre_rol = 'Administrador'
WHERE id_rol = @rol_administrador
  AND nombre_rol <> 'Administrador';

UPDATE roles
SET nombre_rol = 'Tecnico'
WHERE (id_rol = @rol_tecnico OR HEX(nombre_rol) = '54C3A9636E69636F')
  AND nombre_rol <> 'Tecnico';

UPDATE roles
SET nombre_rol = 'Usuario'
WHERE id_rol = @rol_usuario
  AND nombre_rol <> 'Usuario';

UPDATE usuarios u
JOIN roles r ON r.id_rol = u.id_rol
SET u.id_rol = @rol_administrador
WHERE r.nombre_rol IN ('Administrador', 'Admin')
  AND u.id_rol <> @rol_administrador;

UPDATE usuarios u
JOIN roles r ON r.id_rol = u.id_rol
SET u.id_rol = @rol_tecnico
WHERE (r.nombre_rol = 'Tecnico' OR HEX(r.nombre_rol) = '54C3A9636E69636F')
  AND u.id_rol <> @rol_tecnico;

UPDATE usuarios u
JOIN roles r ON r.id_rol = u.id_rol
SET u.id_rol = @rol_tecnico
WHERE r.nombre_rol = 'Soporte'
  AND u.id_area_especialidad IS NOT NULL
  AND u.id_rol <> @rol_tecnico;

UPDATE usuarios u
JOIN roles r ON r.id_rol = u.id_rol
SET u.id_rol = @rol_usuario
WHERE r.nombre_rol = 'Soporte'
  AND u.id_area_especialidad IS NULL
  AND u.id_rol <> @rol_usuario;

UPDATE usuarios u
JOIN roles r ON r.id_rol = u.id_rol
SET u.id_rol = @rol_usuario
WHERE r.nombre_rol IN ('Cliente', 'Usuario', 'Visitante')
  AND u.id_rol <> @rol_usuario;

SET @area_soporte_general := (
  SELECT id_area_especialidad
  FROM areas_especialidad
  WHERE nombre_area_especialidad = 'Soporte General'
  ORDER BY id_area_especialidad
  LIMIT 1
);

UPDATE usuarios
SET id_area_especialidad = @area_soporte_general
WHERE id_rol = @rol_tecnico
  AND activo = 1
  AND id_area_especialidad IS NULL
  AND @area_soporte_general IS NOT NULL;

DELETE r
FROM roles r
LEFT JOIN usuarios u ON u.id_rol = r.id_rol
WHERE r.id_rol NOT IN (@rol_administrador, @rol_tecnico, @rol_usuario)
  AND u.id_usuario IS NULL;

COMMIT;

SELECT id_rol, nombre_rol
FROM roles
ORDER BY id_rol;

SELECT r.nombre_rol, COUNT(u.id_usuario) AS cantidad_usuarios
FROM roles r
LEFT JOIN usuarios u ON u.id_rol = r.id_rol
GROUP BY r.id_rol, r.nombre_rol
ORDER BY r.id_rol;

SELECT u.id_usuario, u.correo, r.nombre_rol
FROM usuarios u
JOIN roles r ON r.id_rol = u.id_rol
WHERE BINARY r.nombre_rol IN ('Soporte', 'Visitante', 'Cliente', 'Admin', 'Técnico');

SELECT u.id_usuario, u.correo, r.nombre_rol, u.activo, u.id_area_especialidad
FROM usuarios u
JOIN roles r ON r.id_rol = u.id_rol
WHERE r.nombre_rol = 'Tecnico'
  AND u.activo = 1
  AND u.id_area_especialidad IS NULL;
