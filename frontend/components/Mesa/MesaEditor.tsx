import { useState } from "react";
import Swal from "sweetalert2";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Button } from "@mui/material";
import PedidoEditor from "../Pedido/PedidoEditor";
import useMesa from "../Hooks/useMesa";


const MesaEditor = ({
  mesa,
  onAbrirPedido,
}: {
  mesa: MesaInterface;
  onAbrirPedido: () => void;
}) => {
  const [cantidadPersonas, setCantidadPersonas] = useState(0);
  const [mozo, setMozo] = useState('');
  const [comentario, setComentario] = useState('');
  const mozos = ['Mozo 1', 'Mozo 2', 'Mozo 3'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '85%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f28b82' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{mesa.name}</h3>
        </div>
        <form>
          <div style={{ margin: '10px 0' }}>
            <label>Cantidad de personas:</label>
            <input
              type="number"
              value={cantidadPersonas}
              onChange={(e) => setCantidadPersonas(Number(e.target.value))}
            />
          </div>
          <div style={{ margin: '10px 0' }}>
            <label>Mozo:</label>
            <select value={mozo} onChange={(e) => setMozo(e.target.value)}>
              <option value="">Seleccionar mozo</option>
              {mozos.map((m, index) => (
                <option key={index} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div style={{ margin: '10px 0' }}>
            <label>Comentario:</label>
            <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="button" onClick={onAbrirPedido}>
              Abrir Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default MesaEditor;
