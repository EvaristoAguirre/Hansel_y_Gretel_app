export interface ICashMovement {
  id: string;
  fecha: string;
  ingresos: number;
  egresos: number;
  ganancia: number;
  estado: "Abierta" | "Cerrada";
}

export interface I_DC_Open {
  comment: string;
  totalCash: number | null;
}