import { mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { config } from "dotenv";

const backendDir = fileURLToPath(new URL("../../", import.meta.url));
config({ path: resolve(backendDir, ".env"), quiet: true });
const archivo = process.env.DB_FILE ?? "data/veterinaria.sqlite";
export const databasePath = archivo === ":memory:" || isAbsolute(archivo)
  ? archivo : resolve(backendDir, archivo);
if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });

// SQLite guarda la base relacional en disco, fuera de la memoria de React.
export const database = new DatabaseSync(databasePath);
database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
database.exec(readFileSync(resolve(backendDir, "database/schema.sql"), "utf8"));
export async function probarConexion(): Promise<void> {
  database.prepare("SELECT 1").get();
  console.log(`Base de datos SQLite: ${databasePath}`);
}
