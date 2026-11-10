import assert from "node:assert/strict";
import { spawn, execFile, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { mysqlConfig, pool } from "../src/config/database.js";

const backendDir = fileURLToPath(new URL("../", import.meta.url));

test("API real con MySQL, SQL del profesor y reinicio del proceso", async (t) => {
  const nombreBase = "test_veterinaria_" + randomUUID().replaceAll("-", "");
  const credenciales = { ...mysqlConfig,
    user: process.env.TEST_DB_USER ?? mysqlConfig.user,
    password: process.env.TEST_DB_PASSWORD ?? mysqlConfig.password,
    database: undefined,
  };
  const conexion = await mysql.createConnection(credenciales);
  const entorno = { ...process.env, DB_NAME: nombreBase,
    DB_USER: credenciales.user, DB_PASSWORD: credenciales.password };
  await conexion.query(`CREATE DATABASE ${mysql.escapeId(nombreBase)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conexion.changeUser({ database: nombreBase });
  let proceso: ChildProcess | undefined;
  let url = "";
  async function iniciar() {
    let salida = "";
    proceso = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
      cwd: backendDir,
      env: { ...entorno, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const hijo = proceso;
    await new Promise<void>((resolve, reject) => {
      const limite = setTimeout(() => reject(new Error(`La API no inició: ${salida}`)), 15000);
      hijo.stdout?.on("data", (datos: Buffer) => {
        salida += datos.toString();
        const direccion = salida.match(/http:\/\/127\.0\.0\.1:(\d+)/);
        if (direccion) { url = direccion[0]; clearTimeout(limite); resolve(); }
      });
      hijo.stderr?.on("data", (datos: Buffer) => { salida += datos.toString(); });
      hijo.once("error", (error) => { clearTimeout(limite); reject(error); });
      hijo.once("exit", (codigo) => {
        clearTimeout(limite);
        reject(new Error(`La API terminó (${codigo}): ${salida}`));
      });
    });
  }
  async function detener() {
    if (proceso && proceso.exitCode === null && proceso.signalCode === null) {
      const terminado = once(proceso, "exit");
      proceso.kill();
      await terminado;
    }
  }
  async function peticion(metodo: string, ruta: string, datos?: unknown) {
    const respuesta = await fetch(`${url}${ruta}`, {
      method: metodo,
      ...(datos === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) }),
      signal: AbortSignal.timeout(10000),
    });
    return { status: respuesta.status, body: respuesta.status === 204 ? null : await respuesta.json() };
  }
  const cita = { mascota: "  Luna  ", cliente: "Ana López", servicio: "Consulta general", fecha: "2026-11-10", hora: "10:30" };
  let id = 0;
  let confirmada: unknown;
  try {
    await t.test("Importa la tabla de Teams y repetir la preparación conserva las cuatro citas", async () => {
      const sql = await readFile(resolve(backendDir, "database/profesor.sql"), "utf8");
      await conexion.query(sql.match(/CREATE TABLE citas[\s\S]*?;/i)![0]);
      await conexion.query(sql.match(/INSERT INTO citas[\s\S]*?;/i)![0]);
      for (let intento = 0; intento < 2; intento++) {
        await promisify(execFile)(process.execPath, ["--import", "tsx", "src/scripts/inicializarBase.ts"],
          { cwd: backendDir, env: entorno });
      }
      const [filas] = await conexion.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM citas");
      assert.equal(Number(filas[0]?.total), 4);
      const [columnas] = await conexion.query<RowDataPacket[]>("SHOW COLUMNS FROM citas LIKE 'mascota'");
      assert.equal(columnas[0]?.Type, "varchar(80)");
      await conexion.query("TRUNCATE TABLE citas");
    });
    await iniciar();
    await t.test("La salud del API comprueba una conexión MySQL real", async () => {
      const r = await peticion("GET", "/api/salud");
      assert.equal(r.status, 200);
      assert.equal(r.body.baseDeDatos, "MySQL");
      assert.equal(r.body.estado, "conectada");
    });
    await t.test("GET inicia con agenda vacía", async () => {
      assert.deepEqual(await peticion("GET", "/api/citas"), { status: 200, body: [] });
    });
    await t.test("POST devuelve 201, id y datos normalizados", async () => {
      const r = await peticion("POST", "/api/citas", cita);
      assert.equal(r.status, 201);
      assert.equal(r.body.cita.mascota, "Luna");
      assert.equal(r.body.cita.estado, "solicitada");
      assert.ok(r.body.cita.created_at);
      id = r.body.cita.id;
      assert.ok(Number.isInteger(id) && id > 0);
    });
    await t.test("GET recupera el registro persistido", async () => {
      const r = await peticion("GET", `/api/citas/${id}`);
      assert.equal(r.status, 200);
      assert.equal(r.body.cliente, cita.cliente);
      assert.equal(r.body.fecha, cita.fecha);
      const [guardadas] = await conexion.execute<RowDataPacket[]>("SELECT mascota, estado, fecha, hora FROM citas WHERE id = ?", [id]);
      assert.equal(guardadas[0]?.mascota, "Luna");
      assert.equal(guardadas[0]?.hora, "10:30:00");
    });
    await t.test("Valida campos vacíos, tipos, límites, fechas y horas", async () => {
      const invalidos = [
        {}, [], null, { ...cita, mascota: " " }, { ...cita, cliente: 42 },
        { ...cita, mascota: "a".repeat(81) }, { ...cita, fecha: "0001-01-01" },
        { ...cita, servicio: "a".repeat(121) }, { ...cita, fecha: "2026-02-30" },
        { ...cita, fecha: "2026-13-01" }, { ...cita, hora: "24:00" },
        { ...cita, hora: "9:00" }, { ...cita, estado: "inventado" },
      ];
      for (const datos of invalidos) {
        const r = await peticion("POST", "/api/citas", datos);
        assert.equal(r.status, 400, JSON.stringify(datos));
        assert.equal(typeof r.body.mensaje, "string");
      }
      const campos = await peticion("POST", "/api/citas", {});
      assert.ok(campos.body.errores.mascota);
    });
    await t.test("JSON mal formado produce 400 y la API sigue funcionando", async () => {
      const r = await fetch(`${url}/api/citas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{mal" });
      assert.equal(r.status, 400);
      assert.equal((await r.json()).mensaje, "El JSON enviado no es válido.");
      assert.equal((await peticion("GET", "/api/salud")).status, 200);
    });
    await t.test("Horario ocupado produce 409 sin insertar", async () => {
      assert.equal((await peticion("POST", "/api/citas", cita)).status, 409);
      assert.equal((await peticion("GET", "/api/citas")).body.length, 1);
    });
    await t.test("PATCH confirma la cita y GET filtra por estado", async () => {
      const r = await peticion("PATCH", `/api/citas/${id}/estado`, { estado: "confirmada" });
      assert.equal(r.status, 200);
      assert.equal(r.body.cita.estado, "confirmada");
      confirmada = r.body.cita;
      assert.deepEqual((await peticion("GET", "/api/citas?estado=confirmada")).body, [confirmada]);
      assert.deepEqual((await peticion("GET", "/api/citas?estado=solicitada")).body, []);
    });
    await t.test("POST y PATCH sobreviven al cierre y reinicio del backend", async () => {
      await detener();
      await iniciar();
      assert.deepEqual((await peticion("GET", `/api/citas/${id}`)).body, confirmada);
    });
    await t.test("PUT actualiza la información guardada", async () => {
      const r = await peticion("PUT", `/api/citas/${id}`, { ...cita, servicio: "Vacunación", estado: "confirmada" });
      assert.equal(r.status, 200);
      assert.equal((await peticion("GET", `/api/citas/${id}`)).body.servicio, "Vacunación");
    });
    await t.test("Cita inactiva comparte horario; reactivarla produce 409", async () => {
      const r = await peticion("POST", "/api/citas", { ...cita, mascota: "Max", estado: "cancelada" });
      assert.equal(r.status, 201);
      assert.equal((await peticion("PATCH", `/api/citas/${r.body.cita.id}/estado`, { estado: "confirmada" })).status, 409);
      assert.equal((await peticion("PUT", `/api/citas/${r.body.cita.id}`, { ...cita, estado: "solicitada" })).status, 409);
    });
    await t.test("Repetir PUT y PATCH con los mismos valores conserva la cita", async () => {
      const actual = (await peticion("GET", `/api/citas/${id}`)).body;
      assert.equal((await peticion("PUT", `/api/citas/${id}`, actual)).status, 200);
      assert.equal((await peticion("PATCH", `/api/citas/${id}/estado`, { estado: actual.estado })).status, 200);
    });
    await t.test("Dos POST simultáneos reservan un solo horario", async () => {
      const otra = { ...cita, hora: "15:00" };
      const respuestas = await Promise.all([peticion("POST", "/api/citas", otra), peticion("POST", "/api/citas", otra)]);
      assert.deepEqual(respuestas.map((r) => r.status).sort(), [201, 409]);
      assert.equal((await peticion("GET", "/api/citas")).body.filter((c: { hora: string }) => c.hora === "15:00").length, 1);
    });
    await t.test("Una cita atendida no puede cancelarse", async () => {
      assert.equal((await peticion("PATCH", `/api/citas/${id}/estado`, { estado: "atendida" })).status, 200);
      assert.equal((await peticion("PATCH", `/api/citas/${id}/estado`, { estado: "cancelada" })).status, 409);
    });
    await t.test("SQL parametrizado trata comillas como datos", async () => {
      const nombre = "Luna'); DROP TABLE citas;--";
      const r = await peticion("POST", "/api/citas", { ...cita, hora: "16:00", mascota: nombre });
      assert.equal(r.status, 201);
      assert.equal((await peticion("GET", `/api/citas/${r.body.cita.id}`)).body.mascota, nombre);
      assert.equal((await peticion("GET", "/api/citas")).status, 200);
    });
    await t.test("DELETE elimina y devuelve 204; GET posterior devuelve 404", async () => {
      assert.equal((await peticion("DELETE", `/api/citas/${id}`)).status, 204);
      assert.equal((await peticion("GET", `/api/citas/${id}`)).status, 404);
    });
    await t.test("Controla ids, filtros, estados y rutas inexistentes", async () => {
      assert.equal((await peticion("GET", "/api/citas/1e1")).status, 400);
      assert.equal((await peticion("GET", "/api/citas/999999")).status, 404);
      assert.equal((await peticion("GET", "/api/citas?estado=otro")).status, 400);
      assert.equal((await peticion("PATCH", "/api/citas/1/estado", {})).status, 400);
      assert.equal((await peticion("GET", "/api/no-existe")).status, 404);
    });
  } finally {
    await detener();
    // Solo se elimina la base creada por esta prueba, nunca veterinaria_db.
    assert.match(nombreBase, /^test_veterinaria_[0-9a-f]{32}$/);
    await conexion.query(`DROP DATABASE ${mysql.escapeId(nombreBase)}`);
    await conexion.end();
    await pool.end();
  }
});
