import type { Cita, EstadoCita, NuevaCita } from "../types";
const API_URL = `${(import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "")}/citas`;
export class ApiError extends Error {
  errores: Record<string, string>;
  constructor(mensaje: string, errores: Record<string, string> = {}) {
    super(mensaje);
    this.errores = errores;
  }
}
async function solicitar<T>(ruta: string, opciones?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, signal: AbortSignal.timeout(10000) });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Comprueba que esté encendido y vuelve a intentar.");
  }
  const resultado = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ApiError(resultado?.mensaje ?? "No fue posible completar la solicitud.", resultado?.errores);
  if (resultado === null) throw new ApiError("El servidor devolvió una respuesta inválida.");
  return resultado as T;
}
export function obtenerCitas(): Promise<Cita[]> {
  return solicitar<Cita[]>("");
}
export async function registrarCita(datos: NuevaCita): Promise<Cita> {
  const resultado = await solicitar<{ cita: Cita }>("", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
  });
  return resultado.cita;
}
export async function actualizarEstado(id: number, estado: EstadoCita): Promise<Cita> {
  const resultado = await solicitar<{ cita: Cita }>(`/${id}/estado`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }),
  });
  return resultado.cita;
}
