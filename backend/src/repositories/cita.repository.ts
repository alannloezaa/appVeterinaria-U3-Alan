import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";
import type { ActualizarCita, Cita, EstadoCita, NuevaCita } from "../types/cita.js";

type CitaRow = Cita & RowDataPacket;
// MySQL almacena TIME con segundos; el formulario utiliza HH:mm.
const columnas = `id, mascota, cliente, servicio,
  DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
  TIME_FORMAT(hora, '%H:%i') AS hora, estado, created_at, updated_at`;

export async function listarCitas(estado?: EstadoCita): Promise<Cita[]> {
  const sql = estado
    ? `SELECT ${columnas} FROM citas WHERE estado = ? ORDER BY fecha, hora, id`
    : `SELECT ${columnas} FROM citas ORDER BY fecha, hora, id`;
  const [rows] = await pool.execute<CitaRow[]>(sql, estado ? [estado] : []);
  return rows;
}
export async function buscarCitaPorId(id: number): Promise<Cita | null> {
  const [rows] = await pool.execute<CitaRow[]>(`SELECT ${columnas} FROM citas WHERE id = ?`, [id]);
  return rows[0] ?? null;
}
export async function horarioOcupado(fecha: string, hora: string, exceptoId?: number): Promise<boolean> {
  let sql = `SELECT id FROM citas WHERE fecha = ? AND hora = ?
    AND estado IN ('solicitada', 'confirmada')`;
  const valores: Array<string | number> = [fecha, hora];
  if (exceptoId !== undefined) { sql += " AND id <> ?"; valores.push(exceptoId); }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, valores);
  return rows.length > 0;
}
export async function crearCita(datos: NuevaCita): Promise<Cita> {
  const [resultado] = await pool.execute<ResultSetHeader>(`INSERT INTO citas
    (mascota, cliente, servicio, fecha, hora, estado) VALUES (?, ?, ?, ?, ?, ?)`,
  [datos.mascota, datos.cliente, datos.servicio, datos.fecha, datos.hora, datos.estado ?? "solicitada"]);
  const cita = await buscarCitaPorId(resultado.insertId);
  if (!cita) throw new Error("La cita se guardó, pero no pudo recuperarse.");
  return cita;
}
export async function actualizarCita(id: number, datos: ActualizarCita): Promise<Cita | null> {
  await pool.execute(`UPDATE citas SET mascota = ?, cliente = ?, servicio = ?,
    fecha = ?, hora = ?, estado = ? WHERE id = ?`,
  [datos.mascota, datos.cliente, datos.servicio, datos.fecha, datos.hora, datos.estado, id]);
  return buscarCitaPorId(id);
}
export async function actualizarEstadoCita(id: number, estado: EstadoCita): Promise<Cita | null> {
  await pool.execute("UPDATE citas SET estado = ? WHERE id = ?", [estado, id]);
  return buscarCitaPorId(id);
}
export async function eliminarCita(id: number): Promise<boolean> {
  const [resultado] = await pool.execute<ResultSetHeader>("DELETE FROM citas WHERE id = ?", [id]);
  return resultado.affectedRows > 0;
}