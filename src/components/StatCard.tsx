type StatCardProps = { titulo: string; valor: number; color: string };

export function StatCard({ titulo, valor, color }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-5">
      <h2 className="min-h-8 text-xs font-semibold text-slate-600 sm:min-h-0 sm:text-sm">{titulo}</h2>
      <p className={`mt-2 text-2xl font-semibold tabular-nums sm:text-3xl ${color}`}>{valor}</p>
    </article>
  );
}
