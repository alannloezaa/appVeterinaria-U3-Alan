# Veterinaria Huellitas — Actividad Sumativa U3

Demo de citas veterinarias con React, TypeScript, Express y SQLite. Parte del
[repositorio de clase](https://github.com/arlinchc/appVeterinaria), revisión `1abceaa`.

Permite consultar citas, registrar una nueva desde el formulario, confirmar las
solicitadas y filtrar por estado. Los datos se guardan en una base relacional en
disco. SQLite se eligió porque la consigna permite otra base relacional y así
la demostración no necesita instalar un servidor MySQL.

## Ejecutar

En Windows, abre **ABRIR_APP.cmd**. Usa Node instalado o el runtime de Codex si
está disponible; instala las dependencias cuando faltan. Mantén la ventana
abierta y entra a **http://127.0.0.1:5173**. Ctrl+C detiene ambos servidores.

Para ejecutar con una instalación normal de **Node.js 24 LTS** (mínimo 22.13):

```sh
npm ci
npm --prefix backend ci
npm run dev
```

Frontend: `http://127.0.0.1:5173`. Backend: `http://127.0.0.1:3000`.
El proxy de Vite envía `/api` a Express. Para modificar la configuración,
consulta `.env.example` y `backend/.env.example`. No hace falta crear `.env`
para ejecutar con los valores predeterminados.

## Persistencia

La base se crea automáticamente en `backend/data/veterinaria.sqlite` usando
`backend/database/schema.sql`. No se reinicia al abrir la aplicación. No hay
datos simulados en React ni se guardan citas en localStorage.

La copia de demostración puede incluir dos registros ficticios, Luna y Max,
con el cliente marcado como “demo”. Las pruebas automatizadas usan otra base
temporal y no modifican esta agenda. Un clon de Git crea una agenda vacía,
porque la base local está excluida del control de versiones.

No borres `backend/data` si deseas conservar tus citas. Para respaldar la base,
detén primero la aplicación y copia esa carpeta completa; pueden existir
archivos auxiliares `-wal` y `-shm` mientras SQLite está abierto.

## API

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/salud` | Comprobar que Express responde |
| GET | `/api/citas` | Listar citas ordenadas por fecha y hora |
| GET | `/api/citas?estado=confirmada` | Filtrar por estado |
| GET | `/api/citas/:id` | Consultar una cita |
| POST | `/api/citas` | Registrar una cita; devuelve 201 |
| PATCH | `/api/citas/:id/estado` | Cambiar el estado |
| PUT | `/api/citas/:id` | Reemplazar los datos de una cita |
| DELETE | `/api/citas/:id` | Eliminar una cita; devuelve 204 |

Ejemplo de cuerpo para POST (datos ficticios; cambia el horario si está ocupado):

```json
{
  "mascota": "Nala",
  "cliente": "Cliente de ejemplo",
  "servicio": "Vacunación",
  "fecha": "2026-11-11",
  "hora": "09:00"
}
```

POST asigna `solicitada` por defecto. Los estados permitidos son `solicitada`,
`confirmada`, `atendida`, `rechazada` y `cancelada`. La interfaz ofrece el alta
y la confirmación; PUT, DELETE y los demás cambios de estado están disponibles
por API, como en el repositorio base.

Los nombres y el servicio deben ser texto sin quedar vacíos: mascota admite
100 caracteres; cliente y servicio, 120. Fecha debe ser un día real en formato
`AAAA-MM-DD` y hora debe usar `HH:mm` de 00:00 a 23:59. Se aceptan fechas
históricas válidas; no se inventó una restricción de fechas futuras.

Una cita solicitada o confirmada ocupa el horario. Otra cita activa en la misma
fecha y hora produce **409**. El índice único de SQLite también protege frente
a solicitudes simultáneas. Las inactivas liberan el horario. Se conserva la
regla del demo que impide cancelar una cita atendida.

## Organización

```text
src/components/NuevaCitaForm.tsx          formulario y validación visible
src/pages/AppointmentPage.tsx            lista, filtros y actualización de React
src/services/citasApi.ts                 fetch y lectura de errores del API
backend/src/app.ts                       configuración de Express y middlewares
backend/src/routes/cita.routes.ts        método y URL → controlador
backend/src/controllers/cita.controller.ts  validaciones y reglas
backend/src/repositories/cita.repository.ts consultas SQL parametrizadas
backend/src/config/database.ts          apertura de la base en disco
backend/src/utils/asyncHandler.ts        rechazos asíncronos → next(error)
backend/src/middlewares/error.middleware.ts respuestas de error centralizadas
```

El recorrido completo se explica con un ejemplo en **GUIA_PARA_EXPLICAR.md**.

## Verificación

```sh
npm run lint
npm run build:all
npm test
```

Las 16 pruebas verifican el API con un servidor real y una base temporal en
disco. Incluyen GET, POST, PATCH, PUT, DELETE, validación de datos, JSON mal
formado, colisiones simultáneas y recuperación de la cita después de cerrar y
volver a iniciar el proceso del backend.

También se comprobó el flujo en Chrome a 1440, 768 y 390 px: alta, confirmación,
filtros, recarga, errores visibles, reintento y navegación por teclado. La
captura del error de conexión corresponde a una interrupción de red simulada
deliberadamente; el resto de las operaciones utilizó el API y la base reales.

## Para presentar y entregar

1. Ejecuta la app y registra una cita con un horario libre.
2. Confírmala y recarga el navegador.
3. Cierra la aplicación, vuelve a abrirla y muestra que la cita continúa.
4. Prueba un campo vacío y un horario ocupado para mostrar las validaciones.
5. Revisa la guía y practica explicar el recorrido y `asyncHandler`.
6. Publica esta versión en tu propio repositorio de GitHub y entrega su enlace
   junto con las evidencias según lo que solicite el profesor.

Repositorio de entrega: https://github.com/alannloezaa/appVeterinaria-U3-Alan

La publicación del código y la entrega en Teams se verifican por separado.
La tarea visible en Teams y el PDF muestran fechas distintas; toma la fecha
activa de Teams como referencia y confírmala con el profesor si la cambia.

## Referencias técnicas

- [Código base del profesor](https://github.com/arlinchc/appVeterinaria)
- [SQLite integrado en Node.js 24](https://nodejs.org/docs/latest-v24.x/api/sqlite.html)
- [Manejo de errores en Express](https://expressjs.com/en/guide/error-handling.html)

La aplicación corresponde al alcance académico del demo administrativo local.
No incorpora autenticación ni es un sistema listo para publicar con datos reales.
