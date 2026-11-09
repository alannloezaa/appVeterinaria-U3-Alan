# Guía para explicar la actividad

La idea principal es sencilla: **React muestra y recoge los datos, Express
atiende la solicitud y SQLite guarda la cita en un archivo.** La interfaz y la
base de datos tienen responsabilidades distintas.

## El recorrido al guardar una cita

Ejemplo de práctica: registrar una mascota llamada Nala. Es un caso ficticio.

1. **Formulario.** `NuevaCitaForm.tsx` recoge mascota, cliente, servicio, fecha
   y hora. Detecta campos vacíos, muestra el error junto al campo y evita
   enviar otra vez mientras se está guardando.
2. **Página.** `AppointmentPage.tsx` llama a `registrarCita(datos)` del servicio.
3. **Fetch.** `citasApi.ts` convierte los datos a JSON y envía un **POST** a
   `/api/citas`, con `Content-Type: application/json`. Vite pasa la petición
   al backend a través de su proxy.
4. **Express.** `express.json()` lee el cuerpo JSON. La ruta de
   `cita.routes.ts` relaciona POST con `registrarCita`, envuelto por
   `asyncHandler`.
5. **Controlador.** Valida los tipos, los campos, la fecha real y la hora. Si
   el horario ya pertenece a otra cita activa, lanza un error 409.
6. **Repositorio.** Ejecuta `INSERT INTO citas ... VALUES (?, ?, ?, ?, ?, ?)`.
   Los valores se pasan separados de la consulta, mediante parámetros. Después
   recupera la fila insertada por su identificador.
7. **Base de datos.** SQLite escribe la fila en el archivo
   `backend/data/veterinaria.sqlite`. Su índice único evita dos reservas
   activas del mismo horario, incluso si se solicitan al mismo tiempo.
8. **Respuesta.** El controlador devuelve **201 Created**, un mensaje y la
   cita completa con su id y estado `solicitada`.
9. **Interfaz.** El servicio devuelve la cita a la página. React la incorpora
   a la lista, actualiza los contadores y muestra la confirmación.

Puedes recordar el orden así:

**formulario → fetch → Express → ruta → controlador → repositorio → base
de datos → respuesta → React**.

## ¿Qué ocurre al confirmar?

El botón envía un **PATCH** a `/api/citas/:id/estado` con
`{"estado":"confirmada"}`. El controlador revisa el id, el estado y las reglas.
El repositorio hace un `UPDATE`, la API devuelve la fila actualizada y React
reemplaza esa cita en la lista. La confirmación también queda guardada.

## ¿Para qué sirve asyncHandler?

El archivo conserva el patrón trabajado en clase:

```ts
export const asyncHandler = (
  funcion: FuncionAsincrona,
): RequestHandler => (req, res, next) => {
  void funcion(req, res, next).catch(next);
};
```

Recibe un controlador asíncrono y devuelve un manejador de Express. Si el
controlador termina bien, responde normalmente. Si su promesa se rechaza,
`.catch(next)` entrega el error a Express mediante `next(error)`.

El middleware `manejarErrores`, colocado después de las rutas, recibe ese
error y prepara una sola respuesta JSON. Por ejemplo, un horario ocupado
produce 409 y un mensaje que el formulario muestra sin borrar lo escrito.
Los errores internos inesperados producen 500 con un mensaje general; los
detalles se registran en la consola del servidor.

`void` indica que el manejador no devuelve la promesa al código que lo llama;
no significa que se ignoren los errores: la promesa ya tiene su `.catch(next)`.
Express 5 también puede propagar promesas rechazadas de controladores
asíncronos; aquí se conserva `asyncHandler` porque forma parte del ejercicio.

## ¿Por qué no se pierden los datos al recargar?

El estado de React se borra al recargar la página. Al montarse otra vez, la
pantalla ejecuta **GET /api/citas**, y el repositorio vuelve a leer las filas
de SQLite. Por eso reaparecen.

Recargar sólo prueba que React consultó de nuevo. Para comprobar mejor la
persistencia, también se cerró el proceso del backend, se inició otra vez y
se verificó que la cita y su estado confirmado seguían en la base de datos.
Las pruebas automáticas repiten ese procedimiento con una base temporal.

## Preguntas de práctica

**Estas preguntas son propuestas para estudiar; no son las preguntas reales
del profesor ni una conversación que ya haya ocurrido.**

**1. ¿Por qué el frontend no consulta directamente la base?**

Porque el navegador se comunica con la API. El backend concentra las
validaciones y las reglas y es quien accede a la base. Así se puede cambiar
la interfaz sin mover las consultas SQL al navegador.

**2. ¿Cuál es la diferencia entre controlador y repositorio?**

El controlador trabaja con la solicitud HTTP y decide si la operación es
válida. El repositorio se encarga de leer o escribir los datos mediante SQL.

**3. ¿Qué cambia entre POST y PATCH en este proyecto?**

POST crea una nueva cita. PATCH modifica el estado de una cita que ya existe.
El id en la URL identifica cuál se debe modificar.

**4. ¿Qué pasa si alguien evita la validación del formulario?**

El backend vuelve a validar. Los controles del navegador ayudan a la persona,
pero no sustituyen la validación del servidor. La base añade restricciones
de campos y del horario activo.

**5. ¿Por qué hay una revisión del horario y un índice único?**

La revisión permite responder con un mensaje claro. El índice protege la
regla en la propia base si dos solicitudes llegan casi al mismo tiempo.

**6. ¿Cómo llega un error a la pantalla?**

El controlador lanza `AppError`; `asyncHandler` lo pasa con `next(error)`;
`manejarErrores` envía el código y el mensaje JSON; el servicio fetch lanza
`ApiError`, y el formulario o la página lo muestra.

## Ensayo corto

Abre la aplicación, crea una cita, confírmala y vuelve a abrir la app. Mientras
lo haces, explica qué archivo actúa en cada paso. Luego intenta guardar otra
en el mismo horario y sigue el recorrido del error. Cuando puedas explicar
esos dos caminos con tus palabras, ya cubres lo central de la actividad.
