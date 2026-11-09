import { useCallback, useEffect, useRef, useState } from "react";
import { AppointmentCard } from "../components/AppointmentCard";
import { StatCard } from "../components/StatCard";
import { NuevaCitaForm } from "../components/NuevaCitaForm";
import { actualizarEstado, obtenerCitas, registrarCita } from "../services/citasApi";
import type { Cita, EstadoCita, NuevaCita } from "../types";

type Filtro = "todas" | EstadoCita;
export function AppointmentsPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const botonNueva = useRef<HTMLButtonElement>(null);

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError("");
    try { setCitas(await obtenerCitas()); }
    catch (fallo) { setError(fallo instanceof Error ? fallo.message : "No fue posible cargar las citas."); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => {
    let vigente = true;
    obtenerCitas().then((datos) => { if (vigente) setCitas(datos); })
      .catch((fallo: unknown) => { if (vigente) setError(fallo instanceof Error ? fallo.message : "No fue posible cargar las citas."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  async function confirmarCita(id: number) {
    if (confirmando !== null) return;
    setConfirmando(id);
    setError("");
    setMensaje("");
    try {
      const actualizada = await actualizarEstado(id, "confirmada");
      setCitas((actuales) => actuales.map((cita) => cita.id === id ? actualizada : cita));
      setMensaje(`La cita de ${actualizada.mascota} quedó confirmada.`);
    } catch (fallo) { setError(fallo instanceof Error ? fallo.message : "Error al confirmar."); }
    finally { setConfirmando(null); }
  }
  async function guardarCita(datos: NuevaCita) {
    const nueva = await registrarCita(datos);
    setCitas((actuales) => [...actuales, nueva].sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)));
    setFiltro("todas");
    setError("");
    setMensaje(`La cita de ${nueva.mascota} se registró correctamente.`);
  }
  function cerrarFormulario() {
    setMostrarFormulario(false);
    botonNueva.current?.focus();
  }
  const citasFiltradas = filtro === "todas" ? citas : citas.filter((cita) => cita.estado === filtro);
  const pendientes = citas.filter((c) => c.estado === "solicitada").length;
  const confirmadas = citas.filter((c) => c.estado === "confirmada").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Agenda de citas</h1>
          <p className="mt-1 text-slate-600">Consulta, registra y confirma las citas de tus pacientes.</p>
        </div>
        <button ref={botonNueva} disabled={cargando} onClick={() => { setMostrarFormulario(true); setMensaje(""); }}
          className="min-h-12 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">+ Nueva cita</button>
      </section>
      <section aria-label="Resumen de la agenda" className="mt-6 grid grid-cols-3 gap-3 sm:mt-8 sm:gap-5">
        <StatCard titulo="Citas registradas" valor={citas.length} color="text-teal-700" />
        <StatCard titulo="Pendientes" valor={pendientes} color="text-amber-700" />
        <StatCard titulo="Confirmadas" valor={confirmadas} color="text-green-700" />
      </section>
      <section className="mt-6 flex items-end justify-between gap-3 sm:mt-8">
        <div className="min-w-0 flex-1">
          <label htmlFor="filtro" className="mb-2 block font-semibold text-slate-700">Filtrar por estado</label>
          <select id="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 sm:w-64">
            <option value="todas">Todas</option><option value="solicitada">Solicitadas</option>
            <option value="confirmada">Confirmadas</option><option value="atendida">Atendidas</option>
            <option value="rechazada">Rechazadas</option><option value="cancelada">Canceladas</option>
          </select>
        </div>
        <button disabled={cargando} onClick={() => { setMensaje(""); void cargarCitas(); }} className="min-h-12 rounded-xl border border-slate-300 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-white sm:px-4 sm:text-base">Actualizar agenda</button>
      </section>
      {mensaje && <p role="status" className="mt-6 rounded-xl bg-green-100 px-4 py-3 text-green-800">{mensaje}</p>}
      {error && <div role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-red-800">
        <p>{error}</p><button onClick={() => void cargarCitas()} className="mt-2 min-h-11 font-semibold underline">Reintentar</button>
      </div>}
      <section aria-label="Citas" aria-busy={cargando} className="mt-6 grid gap-4">
        {cargando ? <p role="status" className="py-8 text-center text-slate-600">Cargando citas…</p>
          : citasFiltradas.length ? citasFiltradas.map((cita) => <AppointmentCard key={cita.id} cita={cita}
            onConfirmar={confirmarCita} confirmando={confirmando === cita.id} deshabilitado={confirmando !== null} />)
          : !error && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            {filtro === "todas" ? "Aún no hay citas. Registra la primera con Nueva cita." : "No se encontraron citas con ese estado."}
          </p>}
      </section>
      {mostrarFormulario && <NuevaCitaForm onGuardar={guardarCita} onCerrar={cerrarFormulario} />}
    </main>
  );
}
