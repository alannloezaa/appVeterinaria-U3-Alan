import type { ErrorRequestHandler, RequestHandler } from "express";

export class AppError extends Error {
  constructor(public status: number, message: string, public errores?: Record<string, string>) {
    super(message);
  }
}
export const rutaNoEncontrada: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `No existe la ruta ${req.method} ${req.path}`));
};
export const manejarErrores: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ mensaje: error.message, ...(error.errores ? { errores: error.errores } : {}) });
    return;
  }
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ mensaje: "El JSON enviado no es válido." });
    return;
  }
  if (error instanceof Error && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ mensaje: "La solicitud es demasiado grande." });
    return;
  }
  if (error instanceof Error && "errcode" in error && error.errcode === 2067 &&
      error.message.includes("citas.fecha, citas.hora")) {
    res.status(409).json({ mensaje: "Ya existe una cita activa en ese horario." });
    return;
  }
  console.error(error);
  res.status(500).json({ mensaje: "No fue posible completar la operación. Inténtalo de nuevo." });
};
