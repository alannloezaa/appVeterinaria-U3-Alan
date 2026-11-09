import type { Request, Response } from "express";
import {
  actualizarCita, actualizarEstadoCita, buscarCitaPorId, crearCita,
  eliminarCita, horarioOcupado, listarCitas,
} from "../repositories/cita.repository.js";
import { AppError } from "../middlewares/error.middleware.js";
import { esEstadoActivo, esEstadoValido, validarCita } from "../utils/validarCita.js";

function obtenerId(req: Request): number {
  const texto = req.params.id;
  const id = Number(texto);
  if (typeof texto !== "string" || !/^[1-9]\d*$/.test(texto) || !Number.isSafeInteger(id)) {
    throw new AppError(400, "El identificador no es válido.");
  }
  return id;
}
export async function obtenerCitas(req: Request, res: Response): Promise<void> {
  const estado = req.query.estado;
  if (estado !== undefined && !esEstadoValido(estado)) throw new AppError(400, "El filtro de estado no es válido.");
  res.json(await listarCitas(estado));
}
export async function obtenerCita(req: Request, res: Response): Promise<void> {
  const cita = await buscarCitaPorId(obtenerId(req));
  if (!cita) throw new AppError(404, "La cita no fue encontrada.");
  res.json(cita);
}
export async function registrarCita(req: Request, res: Response): Promise<void> {
  const datos = validarCita(req.body);
  if (esEstadoActivo(datos.estado ?? "solicitada") && await horarioOcupado(datos.fecha, datos.hora)) {
    throw new AppError(409, "Ya existe una cita activa en ese horario.");
  }
  const cita = await crearCita(datos);
  res.status(201).location(`/api/citas/${cita.id}`).json({ mensaje: "Cita registrada correctamente.", cita });
}
export async function modificarCita(req: Request, res: Response): Promise<void> {
  const id = obtenerId(req);
  if (!await buscarCitaPorId(id)) throw new AppError(404, "La cita no fue encontrada.");
  const datos = validarCita(req.body);
  const estado: unknown = req.body.estado;
  if (!esEstadoValido(estado)) throw new AppError(400, "El estado es obligatorio y debe ser válido.");
  if (esEstadoActivo(estado) && await horarioOcupado(datos.fecha, datos.hora, id)) {
    throw new AppError(409, "Ya existe otra cita activa en ese horario.");
  }
  const cita = await actualizarCita(id, { ...datos, estado });
  res.json({ mensaje: "Cita actualizada correctamente.", cita });
}
export async function cambiarEstado(req: Request, res: Response): Promise<void> {
  const id = obtenerId(req);
  const estado: unknown = req.body?.estado;
  if (!esEstadoValido(estado)) throw new AppError(400, "El estado enviado no es válido.");
  const actual = await buscarCitaPorId(id);
  if (!actual) throw new AppError(404, "La cita no fue encontrada.");
  if (actual.estado === "atendida" && estado === "cancelada") throw new AppError(409, "Una cita atendida no puede cancelarse.");
  if (esEstadoActivo(estado) && await horarioOcupado(actual.fecha, actual.hora, id)) {
    throw new AppError(409, "Ya existe una cita activa en ese horario.");
  }
  const cita = await actualizarEstadoCita(id, estado);
  res.json({ mensaje: "Estado actualizado correctamente.", cita });
}
export async function borrarCita(req: Request, res: Response): Promise<void> {
  if (!await eliminarCita(obtenerId(req))) throw new AppError(404, "La cita no fue encontrada.");
  res.status(204).send();
}
