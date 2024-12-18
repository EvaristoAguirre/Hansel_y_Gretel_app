"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Autocomplete,
} from "@mui/material";
import Swal from "sweetalert2";
import { useProductStore } from "../Producto/useProductStore"; 
import { URI_PRODUCT } from "../URI/URI";

const Cafe = () => {

  // Mocks de salas, mesas y mozos
  const [salas, setSalas] = useState([
    { id: "1", nombre: "Sala Principal" },
    { id: "2", nombre: "Terraza" },
  ]);

  const [mesas, setMesas] = useState([
    {
      id: "101",
      nombre: "Mesa 1",
      cantidadPersonas: 0,
      cliente: null,
      comentario: "",
      estado: "disponible",
      disponibilidad: "disponible",
      salaId: "1",
      mozo: null,
      pedido: [], // Pedido asociado a la mesa
    },
    {
      id: "102",
      nombre: "Mesa 2",
      cantidadPersonas: 0,
      cliente: "Juan Pérez",
      comentario: "Celebración cumpleaños",
      estado: "pidioCuenta",
      disponibilidad: "ocupada",
      salaId: "2",
      mozo: null,
      pedido: [
        { id: "1", name: "Café", price: 200, cantidad: 2 },
        { id: "2", name: "Tostado", price: 500, cantidad: 1 },
      ],
    },
  ]);

  const [mozos, setMozos] = useState([
    { nombre: "Julia", id: "1" },
    { nombre: "Ariel", id: "2" },
    { nombre: "Sol", id: "3" },
    { nombre: "Gustavo", id: "4" },
  ]);


  // useStates para handlers y funciones varias
  const [selectedSala, setSelectedSala] = useState(null);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [mozoSeleccionado, setMozoSeleccionado] = useState(null);
  const [mozosDisponibles, setMozosDisponibles] = useState(null);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [mostrarEditorPedido, setMostrarEditorPedido] = useState(false);

  // Zustand para manejar los productos
  const { products, setProducts, connectWebSocket } = useProductStore();

  // Cargar productos desde la base de datos (API)
  const fetchProducts = async () => {
    try {
      const response = await fetch(URI_PRODUCT, { method: "GET" });
      if (!response.ok) throw new Error("Error al cargar productos");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      Swal.fire("Error", "No se pudieron cargar los productos.", "error");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts(); // Cargar productos al inicio
    connectWebSocket();
  }, [setProducts, connectWebSocket]);

  useEffect(() => {
    setProductosDisponibles(products); // Sincronizar productos disponibles
  }, [products]);

  // Manejar selección de mesa
  const handleSeleccionarMesa = (mesa) => {
    setSelectedMesa(mesa);
    setMostrarEditorPedido(false);
  };

  // Abrir editor de pedidos
  const handleAbrirMesa = () => {
    fetchProducts(); // Asegurar que los productos están actualizados
    setMostrarEditorPedido(true);
  };

  // Mostrar detalles del pedido
  const handleVerPedido = () => {
    setMostrarEditorPedido(true);
  };

  // Manejar selección de productos
  const handleSeleccionarProducto = (producto) => {
    // Comprobar si el producto ya está en el pedido
    const pedidoActual = selectedMesa.pedido || [];
    const productoExistente = pedidoActual.find((p) => p.id === producto.id);

    if (productoExistente) {
      // Incrementar la cantidad si ya existe
      productoExistente.cantidad += 1;
    } else {
      // Agregar nuevo producto al pedido
      pedidoActual.push({ ...producto, cantidad: 1 });
    }

    // Actualizar el estado de la mesa seleccionada
    setSelectedMesa((prevMesa) => ({
      ...prevMesa,
      pedido: [...pedidoActual],
    }));

    // Actualizar las mesas en el estado general
    setMesas((prevMesas) =>
      prevMesas.map((mesa) =>
        mesa.id === selectedMesa.id
          ? { ...selectedMesa, pedido: pedidoActual }
          : mesa
      )
    );
  };

  // Agregar productos al pedido
  const handleAgregarProductosAlPedido = () => {
    const mesaActualizada = {
      ...selectedMesa,
      pedido: [...(selectedMesa.pedido || []), ...productosSeleccionados],
    };

    setMesas((prevMesas) =>
      prevMesas.map((mesa) =>
        mesa.id === selectedMesa.id ? mesaActualizada : mesa
      )
    );

    setProductosSeleccionados([...productosSeleccionados]);
    Swal.fire(
      "Pedido Actualizado",
      `${productosSeleccionados.length} producto(s) añadido(s) al pedido.`,
      "success"
    );
    setMostrarEditorPedido(false);
  };

  // Manejar selección de mozo
  const handleSeleccionarMozo = (mozoSeleccionado) => {
    setSelectedMesa((prevMesa) => ({
      ...prevMesa,
      mozo: mozoSeleccionado,
    }));
  };

  const handleAgregarMozoALaMesa = () => {
    const mesaActualizada = {
      ...selectedMesa,
      mozo: mozoSeleccionado,
    };

    setMesas((prevMesas) =>
      prevMesas.map((mesa) =>
        mesa.id === selectedMesa.id ? mesaActualizada : mesa
      )
    );
  };

  // Operación de subtotal y total
  const sumaSubtotal = () => {
    const subtotal = selectedMesa.pedido.reduce((acumulador, item) => {
      return acumulador + item.price;
    }, 0); 
    
    return subtotal;
  };

  
  return (
    
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Lista de mesas */}
      <div style={{ width: "70%", padding: "20px" }}>
        <div
          style={{
            height: "50px",
            backgroundColor: "#515050",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
          }}
        >
          {salas.map((sala) => (
            <h3
              key={sala.id}
              style={{
                fontSize: "1.25rem",
                color: "#ffffff",
                fontWeight: "400",
                margin: "0 20px",
                cursor: "pointer",
                borderBottom:
                  selectedSala?.id === sala.id ? "1px solid #ffffff" : "none",
              }}
              onClick={() => setSelectedSala(sala)}
            >
              {sala.nombre}
            </h3>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            padding: "20px",
          }}
        >
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              style={{
                width: "14rem",
                height: "4rem",
                backgroundColor:
                  mesa.disponibilidad === "ocupada" ? "#f28b82" : "#aed581",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => handleSeleccionarMesa(mesa)}
            >
              <h3 style={{ fontSize: "1rem" }}>{mesa.nombre}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Cuadro de detalles */}
      <div
        style={{
          width: "30%",
          borderLeft: "1px solid #ccc",
          padding: "20px",
        }}
      >
        {selectedMesa && !mostrarEditorPedido && (
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
                  cantidadPersonas: e.target.value,
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

            {/* <TextField
              label="Mozo/a"
              fullWidth
              margin="dense"
              value={selectedMesa.cliente || ""}
              onChange={(e) =>
                setSelectedMesa({ ...selectedMesa, cliente: e.target.value })
              }
            /> */}
            <TextField
              label="Comentario"
              fullWidth
              margin="dense"
              value={selectedMesa.comentario || ""}
              onChange={(e) =>
                setSelectedMesa({ ...selectedMesa, comentario: e.target.value })
              }
            />
            <Button
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
            </Button>
          </div>
        )}

        {mostrarEditorPedido && (
          <div>
            <h2>{selectedMesa.nombre}</h2>
            <div
              style={{
                height: "2rem",
                backgroundColor: "#856D5E",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#ffffff",
                margin: "1rem 0",
              }}
            >
              <h2>Datos de la mesa</h2>
            </div>
            <div>
              <h3>
                {`${selectedMesa.cantidadPersonas} personas`} <br />
                {`Cliente: ${selectedMesa.cliente}`} <br />
                {`Mozo/a: ${selectedMesa.mozo}`}
              </h3>
            </div>
            <div
              style={{
                height: "2rem",
                backgroundColor: "#856D5E",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#ffffff",
                margin: "1rem 0",
              }}
            >
              <h2>Pedido</h2>
            </div>

            {/* Buscador de productos con dropdown */}
            <Autocomplete
              style={{ margin: "1rem 0" }}
              options={products} // Lista completa de productos
              getOptionLabel={(producto) =>
                `${producto.name} - $${producto.price} (Código: ${producto.code})`
              } // Cómo se muestra cada opción en el dropdown
              onInputChange={(event, value) => {
                const searchTerm = value.toLowerCase();
                setProductosDisponibles(
                  products.filter((producto) =>
                    producto.name.toLowerCase().includes(searchTerm)
                  )
                );
              }}
              onChange={(event, selectedProducto) => {
                if (selectedProducto) {
                  handleSeleccionarProducto(selectedProducto); // Maneja la selección de un producto
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar productos por nombre o código"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderOption={(props, producto) => (
                <li {...props} key={producto.id}>
                  {`${producto.name} - $${producto.price} (Código: ${producto.code})`}
                </li>
              )}
            />
            {/* Buscador de productos */}
            {/* <TextField
              fullWidth
              placeholder="Buscar productos por nombre o código"
              variant="outlined"
              margin="normal"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                setProductosDisponibles(
                  products.filter(
                    (producto) =>
                      producto.name.toLowerCase().includes(searchTerm) ||
                      producto.code.toLowerCase().includes(searchTerm)
                  )
                );
              }}
            /> */}
            {/* Lista de productos disponibles para seleccionar */}
            {/* <List>
              {productosDisponibles.map((producto) => (
                <ListItem
                  key={producto.id}
                  button
                  onClick={() => handleSeleccionarProducto(producto)}
                >
                  <ListItemText
                    primary={`${producto.name} - $${producto.price}`}
                    secondary={`Código: ${producto.code}`}
                  />
                </ListItem>
              ))}
            </List> */}
            {/* Mostrar productos seleccionados en el pedido */}
            <h3>Productos a confirmar</h3>
            {selectedMesa.pedido && selectedMesa.pedido.length > 0 ? (
              <List>
                {selectedMesa.pedido.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${item.name} x${item.cantidad}`}
                      secondary={`$${item.price * item.cantidad}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography style={{ margin: "1rem 0" }}>
                No hay productos en el pedido
              </Typography>
            )}

            {selectedMesa.pedido && selectedMesa.pedido.length > 0 ? (
              <div>
                <h4>{`Total: ${}`}</h4>
              </div>
            ) : (
              ""
            )}
            {/* Botón para guardar el pedido */}
            <Button
              fullWidth
              color="primary"
              variant="contained"
              style={{ marginTop: "10px" }}
              onClick={handleAgregarProductosAlPedido}
            >
              Guardar Pedido
            </Button>
          </div>
        )}
      </div>
    </div> 
    
  );
};

export default Cafe;
