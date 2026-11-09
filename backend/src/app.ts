import cors from "cors";
import express from "express";
import { manejarErrores, rutaNoEncontrada } from "./middlewares/error.middleware.js";
import { citaRouter } from "./routes/cita.routes.js";

export const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: (process.env.FRONTEND_URL ?? "http://localhost:5173,http://127.0.0.1:5173").split(",") }));
app.use(express.json({ limit: "16kb" }));
app.get("/api/salud", (_req, res) => res.json({ mensaje: "API de Veterinaria funcionando" }));
app.use("/api/citas", citaRouter);
app.use(rutaNoEncontrada);
// Al final recibe los errores que asyncHandler pasa mediante next(error).
app.use(manejarErrores);
