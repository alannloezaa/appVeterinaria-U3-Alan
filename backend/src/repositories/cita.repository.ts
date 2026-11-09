import type { SQLInputValue } from "node:sqlite";
import { database } from "../config/database.js";
import type { ActualizarCita, Cita, EstadoCita, NuevaCita } from "../types/cita.js";

export async function listarCitas(estado?: EstadoCita): Promise<Cita[]> {
  const sql = estado
    ? "SELECT * FROM citas WHERE estado = ? ORDER BY fecha, hora, id"
    : "SELECT * FROM citas ORDER BY fecha, hora, id";
  return database.prepare(sql).all(...(estado ? [estado] : [])) as unknown as Cita[];
}
export async function buscarCitaPorId(id: number): Promise<Cita | null> {
  return (database.prepare("SELECT * FROM citas WHERE id = ?").get(id) as Cita | undefined) ?? null;
}
export async function horarioOcupado(fecha: string, hora: string, exceptoId?: number): Promise<boolean> {
  let sql = `SELECT id FROM citas WHERE fecha = ? AND hora = ?
             AND estado IN ('solicitada', 'confirmada')`;
  const valores: SQLInputValue[] = [fecha, hora];
  if (exceptoId !== undefined) {
    sql += " AND id <> ?";
    valores.push(exceptoId);
  }
  return database.prepare(sql).get(...valores) !== undefined;
}
export async function crearCita(datos: NuevaCita): Promise<Cita> {
  const resultado = database.prepare(`INSERT INTO citas
    (mascota, cliente, servicio, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(datos.mascota, datos.cliente, datos.servicio, datos.fecha, datos.hora, datos.estado ?? "solicitada");
  const cita = await buscarCitaPorId(Number(resultado.lastInsertRowid));
  if (!cita) throw new Error("La cita se guard?, pero no pudo recuperarse.");
  return cita;
}
export async function actualizarCita(id: number, datos: ActualizarCita): Promise<Cita | null> {
  database.prepare(`UPDATE citas SET mascota = ?, cliente = ?, servicio = ?,
    fecha = ?, hora = ?, estado = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
    .run(datos.mascota, datos.cliente, datos.servicio, datos.fecha, datos.hora, datos.estado, id);
  return buscarCitaPorId(id);
}
export async function actualizarEstadoCita(id: number, estado: EstadoCita): Promise<Cita | null> {
  database.prepare(`UPDATE citas SET estado = ?,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).run(estado, id);
  return buscarCitaPorId(id);
}
export async function eliminarCita(id: number): Promise<boolean> {
  return database.prepare("DELETE FROM citas WHERE id = ?").run(id).changes > 0;
}
