import { AppError } from "../middlewares/error.middleware.js";
import { estadosPermitidos, type EstadoCita, type NuevaCita } from "../types/cita.js";

export function esEstadoValido(valor: unknown): valor is EstadoCita {
  return typeof valor === "string" && estadosPermitidos.includes(valor as EstadoCita);
}
export function esEstadoActivo(estado: EstadoCita): boolean {
  return estado === "solicitada" || estado === "confirmada";
}
export function validarCita(cuerpo: unknown): NuevaCita {
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo)) {
    throw new AppError(400, "Envía los datos de la cita en un objeto JSON.");
  }
  const datos = cuerpo as Record<string, unknown>;
  const errores: Record<string, string> = {};
  const campos = { mascota: 80, cliente: 120, servicio: 120 };
  const etiquetas = { mascota: "la mascota", cliente: "el cliente", servicio: "el servicio" };
  for (const campo of Object.keys(campos) as Array<keyof typeof campos>) {
    const valor = datos[campo];
    if (typeof valor !== "string" || !valor.trim()) errores[campo] = `Escribe ${etiquetas[campo]}.`;
    else if (valor.trim().length > campos[campo]) errores[campo] = `Usa un máximo de ${campos[campo]} caracteres.`;
  }
  const fecha = typeof datos.fecha === "string" ? datos.fecha.trim() : "";
  const fechaReal = new Date(`${fecha}T00:00:00Z`);
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(fechaReal.getTime()) ||
      fechaReal.toISOString().slice(0, 10) !== fecha) errores.fecha = "Elige una fecha válida (AAAA-MM-DD).";
  const hora = typeof datos.hora === "string" ? datos.hora.trim() : "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) errores.hora = "Elige una hora válida (HH:mm).";
  if (datos.estado !== undefined && !esEstadoValido(datos.estado)) errores.estado = "El estado de la cita no es válido.";
  if (Object.keys(errores).length) throw new AppError(400, "Revisa los datos de la cita.", errores);
  return {
    mascota: (datos.mascota as string).trim(), cliente: (datos.cliente as string).trim(),
    servicio: (datos.servicio as string).trim(), fecha, hora,
    estado: (datos.estado as EstadoCita | undefined) ?? "solicitada",
  };
}
