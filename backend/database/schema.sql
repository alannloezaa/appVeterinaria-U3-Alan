-- Estructura de clase con protección adicional ante reservas simultáneas.
CREATE TABLE IF NOT EXISTS citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota VARCHAR(80) NOT NULL,
  cliente VARCHAR(120) NOT NULL,
  servicio VARCHAR(120) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado ENUM('solicitada', 'confirmada', 'atendida', 'rechazada', 'cancelada')
    NOT NULL DEFAULT 'solicitada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  horario_activo TINYINT GENERATED ALWAYS AS
    (CASE WHEN estado IN ('solicitada', 'confirmada') THEN 1 ELSE NULL END) VIRTUAL,
  UNIQUE KEY citas_horario_activo (fecha, hora, horario_activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;