import React, { useState } from "react";
import EditorPedido from "../Pedido/PedidoEditor";
import { Autocomplete, TextField } from "@mui/material";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";

interface MesaDatosProps {
  selectedMesa: MesaInterface;
  setSelectedMesa: React.Dispatch<React.SetStateAction<MesaInterface>>; 
}
const MesaDatos: React.FC<MesaDatosProps> = ({ selectedMesa, setSelectedMesa }) => {
  // const [mostrarEditorPedido, setMostrarEditorPedido] = useState(false);

  //   // Abrir editor de pedidos
  // const handleAbrirMesa = () => {
  // //   fetchProducts(); // Asegurar que los productos están actualizados
  //   setMostrarEditorPedido(true);
  // };

  return (
    // <div>
    //   <h4>Hello</h4>

    // </div>
    <div
      style={{
        width: "30%",
        borderLeft: "1px solid #ccc",
        padding: "20px",
      }}
    >
      <div>
        <h2>{selectedMesa.nombre}</h2>
        <TextField
          label="Cantidad de personas"
          type="number"
          fullWidth
          margin="dense"
          value={selectedMesa.cantidadPersonas}
          onChange={(e) =>
            setSelectedMesa({
              ...selectedMesa,
              cantidadPersonas: Number(e.target.value),
            })
          }
        />
        <TextField
          label="Cliente"
          fullWidth
          margin="dense"
          value={selectedMesa.cliente || ""}
          onChange={(e) =>
            setSelectedMesa({ ...selectedMesa, cliente: e.target.value })
          }
        />

        <Autocomplete
          options={mozos} // Lista completa de mozos
          getOptionLabel={(mozo) => mozo.nombre} // Cómo se muestra cada opción en el dropdown
          onInputChange={(event, value) => {
            const searchTerm = value.toLowerCase();
            setMozosDisponibles(
              mozos.filter((mozo) =>
                mozo.nombre.toLowerCase().includes(searchTerm)
              )
            );
          }}
          onChange={(event, mozoSeleccionado) => {
            if (mozoSeleccionado) {
              handleSeleccionarMozo(mozoSeleccionado); // Maneja la selección de un mozo
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar mozos por nombre"
              variant="outlined"
              fullWidth
            />
          )}
          renderOption={(props, mozo) => (
            <li {...props} key={mozo.id}>
              {`${mozo.nombre}`}
            </li>
          )}
        />

        <TextField
          label="Comentario"
          fullWidth
          margin="dense"
          value={selectedMesa.comentario || ""}
          onChange={(e) =>
            setSelectedMesa({ ...selectedMesa, comentario: e.target.value })
          }
        />
        {/* <Button
          fullWidth
          color="primary"
          variant="contained"
          onClick={() => {
            handleAbrirMesa();
            handleAgregarMozoALaMesa();
          }}
        >
          Abrir Mesa
        </Button>
        <Button
          fullWidth
          color="secondary"
          variant="outlined"
          style={{ marginTop: "10px" }}
          disabled={
            !selectedMesa.pedido || selectedMesa.pedido.length === 0
          }
          onClick={handleVerPedido}
        >
          Ver Pedido
        </Button> */}
      </div>

      {/* 
    {mostrarEditorPedido && (
      // <EditorPedido></EditorPedido>
    )} */}
    </div>
  );
};

export default MesaDatos;
