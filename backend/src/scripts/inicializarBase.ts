import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { backendDir, mysqlConfig, pool } from "../config/database.js";

export async function inicializarBase(sembrar = true): Promise<void> {
  const conexion = await mysql.createConnection({ ...mysqlConfig, database: undefined });
  try {
    const nombre = mysql.escapeId(mysqlConfig.database);
    await conexion.query(`CREATE DATABASE IF NOT EXISTS ${nombre}
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conexion.query(`USE ${nombre}`);
    await conexion.query(await readFile(resolve(backendDir, "database/schema.sql"), "utf8"));
    // También admite la tabla importada desde Teams sin reemplazar sus registros.
    const [indices] = await conexion.execute<RowDataPacket[]>(`SELECT INDEX_NAME
      FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'citas'
      AND INDEX_NAME = 'citas_horario_activo'`, [mysqlConfig.database]);
    if (indices.length === 0) {
      const [duplicados] = await conexion.query<RowDataPacket[]>(`SELECT fecha, hora
        FROM citas WHERE estado IN ('solicitada', 'confirmada')
        GROUP BY fecha, hora HAVING COUNT(*) > 1 LIMIT 1`);
      if (duplicados.length > 0) {
        throw new Error("Hay horarios activos repetidos. Revísalos antes de añadir el índice; no se borró ninguna cita.");
      }
      const [columnas] = await conexion.execute<RowDataPacket[]>(`SELECT COLUMN_NAME
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'citas'
        AND COLUMN_NAME = 'horario_activo'`, [mysqlConfig.database]);
      if (columnas.length === 0) {
        await conexion.query(`ALTER TABLE citas ADD COLUMN horario_activo TINYINT
          GENERATED ALWAYS AS (CASE WHEN estado IN ('solicitada', 'confirmada') THEN 1 ELSE NULL END) VIRTUAL`);
      }
      await conexion.query("ALTER TABLE citas ADD UNIQUE KEY citas_horario_activo (fecha, hora, horario_activo)");
    }
    const [conteo] = await conexion.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM citas");
    if (sembrar && Number(conteo[0]?.total) === 0) {
      const profesor = await readFile(resolve(backendDir, "database/profesor.sql"), "utf8");
      const insertar = profesor.match(/INSERT INTO citas[\s\S]*?;/i)?.[0];
      if (!insertar) throw new Error("Falta el INSERT de los datos del profesor.");
      await conexion.query(insertar);
    }
    console.log(`Base MySQL preparada: ${mysqlConfig.database}. Se conservaron los datos existentes.`);
  } finally { await conexion.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  inicializarBase().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }).finally(() => pool.end());
}