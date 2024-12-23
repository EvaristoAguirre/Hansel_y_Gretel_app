import React, { useState } from 'react'
import { MesaInterface } from '../Interfaces/Cafe_interfaces';

const EditorPedido = () => {
    const [mostrarEditorPedido, setMostrarEditorPedido] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaInterface>();

    const handleVerPedido = () => {
        setMostrarEditorPedido(true);
      };

//   return (
//     <div>
//         <h2>{selectedMesa.nombre}</h2>
//         <div
//           style={{
//             height: "2rem",
//             backgroundColor: "#856D5E",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             color: "#ffffff",
//             margin: "1rem 0",
//           }}
//         >
//           <h2>Datos de la mesa</h2>
//         </div>
//         <div>
//           <h3>
//             {`${selectedMesa.cantidadPersonas} personas`} <br />
//             {`Cliente: ${selectedMesa.cliente}`} <br />
//             {`Mozo/a: ${selectedMesa.mozo}`}
//           </h3>
//         </div>
//         <div
//           style={{
//             height: "2rem",
//             backgroundColor: "#856D5E",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             color: "#ffffff",
//             margin: "1rem 0",
//           }}
//         >
//           <h2>Pedido</h2>
//         </div>

//         {/* Buscador de productos con dropdown */}
//         <Autocomplete
//           style={{ margin: "1rem 0" }}
//           options={products} // Lista completa de productos
//           getOptionLabel={(producto) =>
//             `${producto.name} - $${producto.price} (Código: ${producto.code})`
//           } // Cómo se muestra cada opción en el dropdown
//           onInputChange={(event, value) => {
//             const searchTerm = value.toLowerCase();
//             setProductosDisponibles(
//               products.filter((producto) =>
//                 producto.name.toLowerCase().includes(searchTerm)
//               )
//             );
//           }}
//           onChange={(event, selectedProducto) => {
//             if (selectedProducto) {
//               handleSeleccionarProducto(selectedProducto); // Maneja la selección de un producto
//             }
//           }}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               label="Buscar productos por nombre o código"
//               variant="outlined"
//               fullWidth
//             />
//           )}
//           renderOption={(props, producto) => (
//             <li {...props} key={producto.id}>
//               {`${producto.name} - $${producto.price} (Código: ${producto.code})`}
//             </li>
//           )}
//         /> 
//         {/* Buscador de productos */}
//         <TextField
//           fullWidth
//           placeholder="Buscar productos por nombre o código"
//           variant="outlined"
//           margin="normal"
//           onChange={(e) => {
//             const searchTerm = e.target.value.toLowerCase();
//             setProductosDisponibles(
//               products.filter(
//                 (producto) =>
//                   producto.name.toLowerCase().includes(searchTerm) ||
//                   producto.code.toLowerCase().includes(searchTerm)
//               )
//             );
//           }}
//         />
//         {/* Lista de productos disponibles para seleccionar */}
//         <List>
//           {productosDisponibles.map((producto) => (
//             <ListItem
//               key={producto.id}
//               button
//               onClick={() => handleSeleccionarProducto(producto)}
//             >
//               <ListItemText
//                 primary={`${producto.name} - $${producto.price}`}
//                 secondary={`Código: ${producto.code}`}
//               />
//             </ListItem>
//           ))}
//         </List>
//         {/* Mostrar productos seleccionados en el pedido */}
//          <h3>Productos a confirmar</h3>
//         {selectedMesa.pedido && selectedMesa.pedido.length > 0 ? (
//           <List>
//             {selectedMesa.pedido.map((item, index) => (
//               <ListItem key={index}>
//                 <ListItemText
//                   primary={`${item.name} x${item.cantidad}`}
//                   secondary={`$${item.price * item.cantidad}`}
//                 />
//               </ListItem>
//             ))}
//           </List>
//         ) : (
//           <Typography style={{ margin: "1rem 0" }}>
//             No hay productos en el pedido
//           </Typography>
//         )}

//         {selectedMesa.pedido && selectedMesa.pedido.length > 0 ? (
//           <div>
//             <h4>{`Total: ${}`}</h4>
//           </div>
//         ) : (
//           ""
//         )} 
//         {/* Botón para guardar el pedido */}
//          <Button
//           fullWidth
//           color="primary"
//           variant="contained"
//           style={{ marginTop: "10px" }}
//           onClick={handleAgregarProductosAlPedido}
//         >
//           Guardar Pedido
//         </Button> 
//        </div> 
//   )
}

export default EditorPedido