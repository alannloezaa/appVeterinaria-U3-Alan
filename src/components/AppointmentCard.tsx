import type { Cita } from '../types';
import { StatusBadge } from './StatusBadge';
type Props = { cita: Cita; onConfirmar: (id: number) => void; confirmando: boolean; deshabilitado: boolean };
export function AppointmentCard({ cita, onConfirmar, confirmando, deshabilitado }: Props) {
  const fecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${cita.fecha}T00:00:00`));
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 break-words">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">{cita.mascota}</h2><StatusBadge estado={cita.estado} />
          </div>
          <p className="mt-2 text-sm text-slate-600">Cliente: {cita.cliente}</p>
          <p className="text-sm text-slate-600">{cita.servicio}</p>
          <p className="mt-1 text-sm font-medium text-slate-700"><time dateTime={`${cita.fecha}T${cita.hora}`}>{fecha} · {cita.hora.slice(0, 5)}</time></p>
        </div>
        {cita.estado === 'solicitada' && <button disabled={deshabilitado} onClick={() => onConfirmar(cita.id)}
          className="min-h-12 shrink-0 rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800">
          {confirmando ? 'Confirmando…' : 'Confirmar cita'}
        </button>}
      </div>
    </article>
  );
}
