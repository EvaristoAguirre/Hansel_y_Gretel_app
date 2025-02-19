import { Print } from "@mui/icons-material";
import { Button, List, ListItem, ListItemText, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import { Product } from "./PedidoEditor";
import { useOrderContext } from '../../app/context/order.context';

export interface OrderProps {
  imprimirComanda: any
  handleDeleteOrder: any
  selectedMesa: MesaInterface;
}

const Order: React.FC<OrderProps> = ({
  imprimirComanda,
  selectedMesa,
}) => {
  const {
    selectedOrderByTable,
    confirmedProducts,
    handleDeleteOrder
  } = useOrderContext();

  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calcularTotal = () => {
      if (confirmedProducts.length > 0) {
        setTotal(
          confirmedProducts.reduce((acc: number, item: Product) => {
            return acc + item.price * item.quantity;
          }, 0)
        );
      }
    };
    calcularTotal();
  }, [confirmedProducts]);

  return (
    <>
      {
        selectedMesa.state === 'open' ?
          <div style={{
            width: "100%", display: "flex",
            flexDirection: "column", border: "1px solid #d4c0b3",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", padding: "1rem",
            justifyContent: "space-between"
          }}>

            <div>
              <div
                style={{
                  height: "2rem",
                  backgroundColor: "#7e9d8a",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "black",
                  margin: "1rem 0",
                  width: "100%",
                }}
              >
                <h2>PEDIDO</h2>
              </div>
              <List
                className="custom-scrollbar"
                style={{
                  maxHeight: "14rem",
                  overflowY: "auto",
                  padding: "0.5rem",
                  border: "2px solid #7e9d8a",
                  borderRadius: "5px",
                  marginTop: "0.5rem",
                }}
              >
                {confirmedProducts.map((item: any, index: number) => (
                  <ListItem
                    key={index}
                    style={{
                      backgroundColor: "#eceae8",
                      margin: "0.3rem 0",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "5px",
                      height: "3rem",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      sx={{ border: "1px solid #856D5E", color: "#856D5E" }}
                      style={{
                        color: "black",
                        width: "2rem",
                        textAlign: "center",
                        borderRadius: "5px",
                      }}
                    >
                      {item.quantity}
                    </Typography>
                    <Tooltip title={item.name} arrow>
                      <ListItemText
                        style={{
                          margin: "0 1rem 0 0.5rem",
                          fontSize: "1rem",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                          minWidth: "5rem",
                          maxWidth: "5rem",

                        }}
                        primary={item.name}
                      />
                    </Tooltip>
                    <Typography
                      style={{
                        margin: "0 1rem 0 0.5rem",
                        fontSize: "1rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {`$ ${item.price * item.quantity}`}
                    </Typography>
                    {/* <IconButton onClick={() => deleteConfirmProduct(item.productId)}>
                      <Delete />
                    </IconButton> */}
                  </ListItem>

                ))}
              </List>
              <Typography
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  textAlign: "left",
                  fontWeight: "bold",
                }}
              >
                Total: ${total}
              </Typography>
              <Typography
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  textAlign: "left",
                  fontWeight: "bold",
                }}
              >
                Cantidad de productos: {confirmedProducts.length}
              </Typography>
            </div>
            <div>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: "#7e9d8a",
                  "&:hover": { backgroundColor: "#f9b32d", color: "black" },
                }}
                onClick={imprimirComanda}
              >
                <Print style={{ marginRight: "5px" }} /> Imprimir Comanda
              </Button>
              {
                confirmedProducts.length > 0 &&
                <Button
                  fullWidth
                  color="error"
                  variant="outlined"
                  style={{ marginTop: "1rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                  onClick={() => handleDeleteOrder(selectedOrderByTable?.id || null)}
                >
                  Anular Pedido
                </Button>
              }
            </div>

          </div>
          : <div className="flex justify-center text-red-500 font-bold my-16">
            COMPLETAR PASO 1
          </div>
      }
    </>
  )
};

export default Order;