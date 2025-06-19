export interface ICashMovement {
  id: string;
  fecha: string;
  ingresos: number;
  egresos: number;
  ganancia: number;
  estado: "Abierta" | "Cerrada";
}
