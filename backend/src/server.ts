import { database, probarConexion } from "./config/database.js";
import { app } from "./app.js";

async function iniciarServidor(): Promise<void> {
  await probarConexion();
  const server = app.listen(Number(process.env.PORT ?? 3000), "127.0.0.1", () => {
    const direccion = server.address();
    if (direccion && typeof direccion === "object") console.log(`Servidor ejecutándose en http://127.0.0.1:${direccion.port}`);
  });
  server.on("error", (error) => {
    console.error("No fue posible iniciar el servidor:", error.message);
    database.close();
    process.exitCode = 1;
  });
  const cerrar = () => server.close(() => { database.close(); });
  process.once("SIGINT", cerrar);
  process.once("SIGTERM", cerrar);
}
iniciarServidor().catch((error: unknown) => {
  console.error("No fue posible iniciar el servidor:", error);
  process.exitCode = 1;
});
