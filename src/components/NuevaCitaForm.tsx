import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { NuevaCita } from "../types";
import { ApiError } from "../services/citasApi";

type Props = { onGuardar: (datos: NuevaCita) => Promise<void>; onCerrar: () => void };
type Campo = keyof NuevaCita;
const etiquetas: Record<Campo, string> = {
  mascota: "Mascota", cliente: "Cliente", servicio: "Servicio", fecha: "Fecha", hora: "Hora",
};
function fechaLocal() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}
export function NuevaCitaForm({ onGuardar, onCerrar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const resumen = useRef<HTMLDivElement>(null);
  const enviando = useRef(false);
  const [datos, setDatos] = useState<NuevaCita>({ mascota: "", cliente: "", servicio: "", fecha: fechaLocal(), hora: "" });
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  useEffect(() => {
    const elemento = dialogo.current;
    elemento?.showModal();
    return () => elemento?.close();
  }, []);
  useEffect(() => {
    if (intentos > 0) resumen.current?.focus();
  }, [intentos]);

  function cerrar() {
    dialogo.current?.close();
    onCerrar();
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando.current) return;
    const fallos: Partial<Record<Campo, string>> = {};
    for (const campo of Object.keys(etiquetas) as Campo[]) {
      if (!datos[campo].trim()) fallos[campo] = `Completa el campo ${etiquetas[campo].toLowerCase()}.`;
    }
    setErrores(fallos);
    setError("");
    if (Object.keys(fallos).length) { setError("Revisa los campos indicados."); setIntentos((valor) => valor + 1); return; }
    enviando.current = true;
    setGuardando(true);
    try {
      await onGuardar({ ...datos, mascota: datos.mascota.trim(), cliente: datos.cliente.trim(), servicio: datos.servicio.trim() });
      cerrar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No fue posible registrar la cita.");
      if (fallo instanceof ApiError) setErrores(fallo.errores);
      setIntentos((valor) => valor + 1);
    } finally {
      enviando.current = false;
      setGuardando(false);
    }
  }
  return (
    <dialog ref={dialogo} aria-labelledby="titulo-nueva-cita"
      onCancel={(evento) => { evento.preventDefault(); if (!guardando) cerrar(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900 backdrop:bg-slate-950/40 sm:p-8">
      <h2 id="titulo-nueva-cita" className="text-2xl font-bold">Nueva cita</h2>
      <p className="mt-2 text-sm text-slate-600">Todos los campos son obligatorios. La cita se registrará como solicitada.</p>
      <form onSubmit={guardar} noValidate className="mt-6">
        {error && <div ref={resumen} role="alert" tabIndex={-1} className="mb-5 rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-semibold">{error}</p>
          {Object.values(errores).some(Boolean) && <ul className="mt-2 list-inside list-disc text-sm">
            {(Object.entries(errores).filter(([, texto]) => Boolean(texto)) as [Campo, string][]).map(([campo, texto]) => <li key={campo}><a className="underline" href={`#cita-${campo}`}>{texto}</a></li>)}
          </ul>}
        </div>}
        <div className="grid gap-5 sm:grid-cols-2">
          {(Object.keys(etiquetas) as Campo[]).map((campo) => <div key={campo} className={campo === "servicio" ? "sm:col-span-2" : ""}>
            <label htmlFor={`cita-${campo}`} className="mb-2 block text-sm font-semibold">{etiquetas[campo]}</label>
            <input id={`cita-${campo}`} name={campo} required
              type={campo === "fecha" ? "date" : campo === "hora" ? "time" : "text"}
              maxLength={campo === "mascota" ? 100 : campo === "cliente" || campo === "servicio" ? 120 : undefined}
              value={datos[campo]} disabled={guardando} aria-invalid={Boolean(errores[campo])}
              aria-describedby={errores[campo] ? `error-${campo}` : undefined}
              onChange={(evento) => { setDatos({ ...datos, [campo]: evento.target.value }); setErrores({ ...errores, [campo]: undefined }); }}
              className="min-h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base aria-invalid:border-red-600" />
            {errores[campo] && <p id={`error-${campo}`} className="mt-1 text-sm text-red-700">{errores[campo]}</p>}
          </div>)}
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={guardando} onClick={cerrar} className="min-h-12 rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={guardando} className="min-h-12 rounded-lg bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">{guardando ? "Guardando…" : "Guardar cita"}</button>
        </div>
      </form>
    </dialog>
  );
}
