import type { EstadoCita } from '../types';
const estilos: Record<EstadoCita, string> = {
  solicitada: 'bg-amber-100 text-amber-800', confirmada: 'bg-green-100 text-green-800',
  atendida: 'bg-slate-200 text-slate-700', rechazada: 'bg-red-100 text-red-800', cancelada: 'bg-slate-200 text-slate-700',
};
export function StatusBadge({ estado }: { estado: EstadoCita }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estilos[estado]}`}>{estado}</span>;
}
