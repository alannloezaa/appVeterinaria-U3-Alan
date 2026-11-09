export type EstadoCita = 'solicitada' | 'confirmada' | 'atendida' | 'rechazada' | 'cancelada';
export type Cita = {
  id: number;
  mascota: string;
  cliente: string;
  servicio: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  created_at: string;
  updated_at: string;
};
export type NuevaCita = Pick<Cita, 'mascota' | 'cliente' | 'servicio' | 'fecha' | 'hora'>;
