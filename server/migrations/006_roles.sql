-- P3: papel mínimo de administrador.
ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE usuarios JOIN (SELECT MIN(id) AS id FROM usuarios) m ON usuarios.id = m.id
  SET usuarios.is_admin = TRUE;
