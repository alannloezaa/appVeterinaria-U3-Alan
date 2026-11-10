# Veterinaria Huellitas - Actividad Sumativa U3

Aplicación de citas con React, TypeScript, Express y **MySQL**. Parte del [repositorio de clase](https://github.com/arlinchc/appVeterinaria) y usa la base `veterinaria_db`, la tabla `citas` y los tipos de datos del SQL compartido por el profesor en Teams.

Permite consultar, registrar una cita con POST, confirmar con PATCH y filtrar por estado. Los datos se guardan en MySQL y se recuperan al recargar o reiniciar el backend.

## Preparar en otra computadora

Se necesitan Node.js 24 LTS y un servidor MySQL 8.0/8.4 iniciado. Desde la carpeta del proyecto:

```powershell
npm ci
npm --prefix backend ci
Copy-Item backend/.env.example backend/.env
```

Edita `backend/.env` con el host, puerto, usuario y contraseña de **tu** MySQL. El archivo de ejemplo usa el puerto habitual 3306; en el equipo de Alan se preparó una instancia portable local en 3307. Las credenciales reales están excluidas de Git y del ZIP.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_clave
DB_NAME=veterinaria_db
```

Después ejecuta:

```powershell
npm run db:init
npm run dev
```

Abre **http://127.0.0.1:5173**. Express escucha en **http://127.0.0.1:3000**. Vite envía las peticiones `/api` al backend. `GET /api/salud` comprueba la conexión con MySQL.

En el equipo de Alan también se puede abrir **ABRIR_APP.cmd**: encuentra Node, inicia el MySQL portable ya preparado si hace falta y abre los servidores de la app. Mantén esa consola abierta; Ctrl+C detiene frontend y backend. MySQL continúa como proceso local.

## Base de datos de clase

- `backend/database/profesor.sql`: transcripción del SQL de Teams, con sus cuatro citas de ejemplo. Se conserva como referencia para revisar en MySQL Workbench.
- `backend/database/schema.sql`: los mismos campos y tipos de la clase, más una columna generada y un índice que impiden dos reservas activas en el mismo horario.
- `npm run db:init`: prepara la base sin borrar las citas existentes. Inserta los cuatro ejemplos del profesor solo cuando la tabla está vacía. Si ya importaste el SQL de Teams, conserva sus registros y añade el índice.
- `backend/database/respaldo_demostracion.sql`: respaldo de la base utilizada en la demostración. Para restaurarlo, usa una base nueva; no hace falta importarlo para ejecutar la app.

Los datos reales de MySQL se guardan en el directorio de datos del servidor, fuera del repositorio. El archivo `.sql` permite crear o respaldar la base. React no guarda citas en localStorage.

Se conservaron las dos citas de demostración anteriores, Luna y Max, al migrarlas a MySQL. Sus identificadores cambiaron para no ocupar los de las cuatro citas del profesor. Todos los registros de demostración son ficticios.

## API

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/salud` | Estado del API y conexión MySQL |
| GET | `/api/citas` | Listar citas |
| GET | `/api/citas?estado=confirmada` | Filtrar por estado |
| GET | `/api/citas/:id` | Consultar una cita |
| POST | `/api/citas` | Registrar una cita; devuelve 201 |
| PATCH | `/api/citas/:id/estado` | Cambiar el estado |
| PUT | `/api/citas/:id` | Actualizar los datos completos |
| DELETE | `/api/citas/:id` | Eliminar una cita; devuelve 204 |

Ejemplo para POST (cambia el horario si está ocupado):

```json
{"mascota":"Nala","cliente":"Cliente de prueba U3","servicio":"Vacunación","fecha":"2026-11-11","hora":"09:30"}
```

Mascota admite hasta 80 caracteres; cliente y servicio, 120. El backend valida tipos, campos vacíos, fechas reales entre los años 1000 y 9999, hora `HH:mm` y los cinco estados de clase. Solicitada y confirmada ocupan horario; las citas inactivas lo liberan. Un conflicto devuelve 409 y conserva el formulario. Se mantiene la regla de no cancelar una cita atendida.

## Flujo del código

`NuevaCitaForm.tsx` recoge los datos; `citasApi.ts` envía fetch; Express selecciona la ruta; el controlador valida; el repositorio ejecuta SQL parametrizado mediante el pool de `database.ts`; MySQL guarda la fila; el API responde y React actualiza la agenda.

`backend/src/utils/asyncHandler.ts` envía los rechazos de los controladores a `next(error)`. El middleware final centraliza los mensajes 400, 404, 409, 413, 503 y 500. La guía **GUIA_PARA_EXPLICAR.md** desarrolla el recorrido y contiene preguntas de práctica.

## Verificación

```powershell
npm run lint
npm run build:all
npm test
```

Las pruebas usan MySQL real. Crean una base temporal con nombre `test_veterinaria_...`, verifican importación de la tabla de Teams, preparación repetida, GET, POST, PATCH, PUT, DELETE, validación, solicitudes simultáneas y persistencia al reiniciar Express. Al terminar eliminan únicamente esa base temporal.

El usuario de pruebas necesita permiso para crear y eliminar su base temporal. Si el usuario de la app solo tiene permisos sobre `veterinaria_db`, define `TEST_DB_USER` y `TEST_DB_PASSWORD` para una cuenta local de pruebas. En el equipo de Alan, el script usa la configuración privada del MySQL portable; las claves no se publican.

## Entrega y explicación

Entrega el enlace a tu repositorio actualizado y las evidencias de ejecución que solicite el profesor. El PDF documenta la app y la comprobación de persistencia en MySQL. Practica explicar una petición POST completa y el papel de `asyncHandler`; la comprensión individual se evalúa aparte.

Repositorio: https://github.com/alannloezaa/appVeterinaria-U3-Alan

Referencias: [mysql2](https://sidorares.github.io/node-mysql2/docs), [MySQL](https://dev.mysql.com/doc/refman/8.4/en/), [Express](https://expressjs.com/en/guide/error-handling.html).