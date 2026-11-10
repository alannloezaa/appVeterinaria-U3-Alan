import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { config } from "dotenv";

export const backendDir = fileURLToPath(new URL("../../", import.meta.url));
config({ path: resolve(backendDir, ".env"), quiet: true });
export const mysqlConfig = {
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "veterinaria_db",
  charset: "utf8mb4", dateStrings: true, timezone: "Z",
};
export const pool = mysql.createPool({
  ...mysqlConfig, waitForConnections: true, connectionLimit: 10,
  queueLimit: 0, connectTimeout: 10000,
});
export async function probarConexion(): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    await connection.query("SELECT id FROM citas LIMIT 1");
    console.log(`Conexión con MySQL establecida: ${mysqlConfig.database}`);
  } finally { connection.release(); }
}