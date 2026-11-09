CREATE TABLE IF NOT EXISTS citas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mascota TEXT NOT NULL CHECK (length(trim(mascota)) BETWEEN 1 AND 100),
  cliente TEXT NOT NULL CHECK (length(trim(cliente)) BETWEEN 1 AND 120),
  servicio TEXT NOT NULL CHECK (length(trim(servicio)) BETWEEN 1 AND 120),
  fecha TEXT NOT NULL CHECK (fecha GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  hora TEXT NOT NULL CHECK (hora GLOB '[0-2][0-9]:[0-5][0-9]' AND hora <= '23:59'),
  estado TEXT NOT NULL DEFAULT 'solicitada'
    CHECK (estado IN ('solicitada', 'confirmada', 'atendida', 'rechazada', 'cancelada')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- También evita reservas simult?neas del mismo horario en la base.
-- Las citas inactivas liberan su horario.
CREATE UNIQUE INDEX IF NOT EXISTS citas_horario_activo
  ON citas (fecha, hora) WHERE estado IN ('solicitada', 'confirmada');
