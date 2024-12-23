export interface PedidoInterface {
  id: string;
  name: string;
  price: number;
  cantidad: number;
}

export interface MozoInterface {
  id: string;
  nombre: string;
} 

export interface MesaInterface {
  id: string;
  nombre: string;
  numero: number;
  comentario: string;
  cantidadPersonas: number;
  cliente: string | null;
  estado: "disponible" | "abierta" | "pendienteDePago" | "cerrada"; // Estados posibles de la mesa
  salaId: string; // ID de la sala a la que pertenece
  mozo: MozoInterface | null;
  pedido: PedidoInterface[]; // Lista de pedidos asociados
}

