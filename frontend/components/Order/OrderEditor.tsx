import React, { useEffect, useState } from "react";
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Chip,
  Checkbox,
  Divider,
} from "@mui/material";
import { Add, Remove, Delete, Comment, AutoAwesome, SpaceBar } from "@mui/icons-material";
import { Box } from "@mui/system";
import { useOrderContext } from "../../app/context/order.context";
import "../../styles/pedidoEditor.css";
import { useProducts } from "../Hooks/useProducts";
import useOrder from "../Hooks/useOrder";
import LoadingLottie from "../Loader/Loading";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";
import AutoGrowTextarea from "../Utils/Textarea";
import { fetchCategories } from "@/api/categories";
import { ICategory } from "../Interfaces/ICategories";
import { searchProducts } from "@/api/products";
import AutoCompleteProduct from "../Utils/Autocomplete";
import { CategorySelector } from "./filterCategories";
import { useAuth } from "@/app/context/authContext";
import { ToppingsGroup } from '../../../backend/src/ToppingsGroup/toppings-group.entity';
import { ITopping, IToppingsGroup } from '../Interfaces/IToppings';
import { ProductToppingsGroupDto } from '../Interfaces/IProducts';
import { fetchToppingsGroupById } from "@/api/topping";
import ToppingsGroupsViewer from "./ToppingsSection.tsx/ToppingsGroupsViewer";



export interface Product {
  price: number;
  quantity: number;
  productId: string;
  name: string;
}

interface Props {
  handleNextStep: () => void;
  handleCompleteStep: () => void;
  handleBackStep: () => void;
  handleReset: () => void;
}
const OrderEditor = ({
  handleNextStep,
  handleBackStep,
  handleCompleteStep,
  handleReset,
}: Props) => {
  const { productosDisponibles, setProductosDisponibles } = useOrder();
  const { fetchAndSetProducts, products } = useProducts();
  const { getAccessToken } = useAuth();

  useEffect(() => {
    const token = getAccessToken();
    token && fetchAndSetProducts(token);
  }, []);

  const {
    selectedProducts,
    setSelectedProducts,
    confirmedProducts,
    selectedOrderByTable,
    handleSelectedProducts,
    handleDeleteSelectedProduct,
    increaseProductNumber,
    decreaseProductNumber,
    productComment,
    handleEditOrder,
    highlightedProducts,
    removeHighlightedProduct,
    handleAddTopping
  } = useOrderContext();

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visibleCommentInputs, setVisibleCommentInputs] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [categories, setCategories] = useState<ICategory[]>([]);
  // const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const token = getAccessToken();
  const [isPriority, setIsPriority] = useState<boolean>(false);

  useEffect(() => {
    token && fetchCategories(token).then((categories = []) => setCategories(categories));
  }, []);

  const confirmarPedido: () => Promise<void> = async () => {
    if (selectedOrderByTable) {
      setLoading(true);
      try {
        await handleEditOrder(
          selectedOrderByTable.id,
          selectedProducts,
          selectedOrderByTable.numberCustomers,
          selectedOrderByTable.comment,
          isPriority
        );
        setSelectedProducts([]);
        handleCompleteStep();
        handleNextStep();
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const calcularSubtotal = () => {
      setSubtotal(
        selectedProducts.reduce((acc, item) => {
          return acc + (item.unitaryPrice ?? 0) * item.quantity;
        }, 0)
      );
    };
    calcularSubtotal();

    const calculateTotal = () => {
      setTotal(
        confirmedProducts?.reduce((acc, item) => {
          return acc + (item.unitaryPrice ?? 0) * item.quantity;
        }, 0)
      );
    };
    calculateTotal();
  }, [selectedProducts, confirmedProducts]);

  const toggleCommentInput = (productId: string) => {
    setVisibleCommentInputs((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  /**
   *
   * @param productId - El ID del producto a eliminar
   * @returns La función `handleDeleteProductAndComment` elimina un producto del contexto y su comentario asociado en el estado local.
   * Si el producto eliminado estaba siendo editado, se cancela la edición.
   */
  const handleDeleteProductAndComment = (productId: string) => {
    handleDeleteSelectedProduct(productId)
    setCommentInputs((prevCommentInputs) => {
      const newCommentInputs = { ...prevCommentInputs };
      delete newCommentInputs[productId];
      return newCommentInputs;
    });
  };

  /**
   * Fracción de código para buscar productos en base a nombre,
   * código o categorías seleccionadas.
   */
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const searchProductsFiltered = async (term: string, categories: string[]) => {
    const trimmedTerm = term.trim();
    const results = token && await searchProducts(trimmedTerm, token, categories.join(','));
    if (results) setProductosDisponibles(results);
  };

  const handleSearch = (value: string) => {
    const trimmedValue = value.trim();
    setSearchTerm(trimmedValue);
    searchProductsFiltered(trimmedValue, selectedCats);
  };

  useEffect(() => {
    searchProductsFiltered(searchTerm, selectedCats);
  }, [selectedCats]);

  const [visibleToppings, setVisibleToppings] = useState<{ [productId: string]: boolean }>({});
  const handleShowToppings = (productId: string) => {
    setVisibleToppings(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // const shakeKeyframes = {
  //   "@keyframes shake": {
  //     "0%": { transform: "translateX(0)" },
  //     "25%": { transform: "translateX(-2px)" },
  //     "50%": { transform: "translateX(2px)" },
  //     "75%": { transform: "translateX(-2px)" },
  //     "100%": { transform: "translateX(0)" },
  //   }
  // };





  return loading ? (
    <LoadingLottie />
  ) : (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #d4c0b3",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: "1rem",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              height: "2rem",
              backgroundColor: "#856D5E",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#ffffff",
              marginBottom: "1rem",
            }}
          >
            <h2>Seleccionar productos</h2>
          </div>
          <Box sx={{ borderRadius: "5px" }}>
            <CategorySelector
              categories={categories}
              selected={selectedCats}
              onChangeSelected={setSelectedCats}
            />


            <AutoCompleteProduct
              options={productosDisponibles}
              onSearch={(value) => handleSearch(value)}
              onSelect={handleSelectedProducts}
            />

            {/* PRODUCTOS PRE-SELECCIONADOS */}
            {selectedProducts.length > 0 ? (
              <List
                className="custom-scrollbar"
                style={{
                  maxHeight: "16rem",
                  overflowY: "auto",
                  border: "2px solid #856D5E",
                  borderRadius: "5px",
                  marginTop: "0.5rem",
                  fontSize: "0.8rem",
                  padding: "0.5rem",
                }}
              >
                <div className="w-full flex items-center justify-start mb-2 text-[#856D5E]">
                  <h5>Productos sin confirmar:</h5>
                </div>

                {selectedProducts.map((item, index) => (
                  <ListItem
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      width: "100%",
                      borderBottom: "1px solid #856D5E",
                      padding: "3px",

                    }}
                  >
                    {/* Línea principal de datos del producto */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#ffffff",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <IconButton size="small" sx={{ padding: "4px" }} onClick={() => decreaseProductNumber(item.productId)}>
                          <Remove fontSize="small" color="error" />
                        </IconButton>
                        <Typography
                          sx={{
                            border: "1px solid #856D5E",
                            color: "#856D5E",
                            width: "1.5rem",
                            textAlign: "center",
                            borderRadius: "5px",
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <IconButton size="small" sx={{ padding: "4px" }} onClick={() => increaseProductNumber(item.productId)}>
                          <Add fontSize="small" color="success" />
                        </IconButton>
                      </div>


                      <Tooltip title={item.productName} arrow>
                        <ListItemText
                          style={{
                            color: "black",
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 1,
                            overflow: "hidden",
                            maxWidth: "15rem",
                          }}
                          primary={capitalizeFirstLetter(item.productName)}
                        />
                      </Tooltip>

                      <Typography style={{ color: "black" }}>
                        ${(item.unitaryPrice ?? 0) * item.quantity}
                      </Typography>

                      {/* ICON DE AGREGADOS */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {item.allowsToppings && (
                          <Tooltip title="Agregados" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                handleShowToppings(item.productId);
                                removeHighlightedProduct(item.productId);  // <--- usás la de contexto
                              }}
                              sx={{
                                "@keyframes heartbeat": {
                                  "0%": { transform: "scale(1)" },
                                  "14%": { transform: "scale(1.3)" },
                                  "28%": { transform: "scale(1)" },
                                  "42%": { transform: "scale(1.3)" },
                                  "70%": { transform: "scale(1)" },
                                },
                                animation: highlightedProducts.has(item.productId)
                                  ? "heartbeat 2.2s infinite ease-in-out"
                                  : "none",
                              }}
                            >
                              <AutoAwesome />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Comentarios" arrow>
                          <IconButton onClick={() => toggleCommentInput(item.productId)}>
                            <Comment style={{ color: "#856D5E" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" arrow>
                          <IconButton onClick={() =>
                            handleDeleteProductAndComment(item.productId)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Comentario */}
                    {
                      visibleCommentInputs[item.productId] && (
                        <div style={{ marginTop: "0.5rem", width: "100%" }}>
                          <AutoGrowTextarea
                            value={
                              commentInputs[item.productId] !== undefined
                                ? commentInputs[item.productId]
                                : item.commentOfProduct ?? ""
                            }
                            placeholder="Comentario al producto"
                            onChange={(value) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [item.productId]: value,
                              }))
                            }
                            onBlur={() =>
                              productComment(item.productId, commentInputs[item.productId] || "")
                            }
                          />
                        </div>
                      )
                    }
                    {/* ::::::::::::::::::::::::::::: */}
                    {/* AGREGADOS */}
                    {visibleToppings[item.productId] && (
                      <ToppingsGroupsViewer
                        groups={item.availableToppingGroups ?? []}
                        fetchGroupById={(id) => fetchToppingsGroupById(token as string, id)}
                        productId={item.productId}
                      />
                    )}

                  </ListItem>
                ))}
              </List>

            ) : (
              <Typography
                style={{
                  margin: "1rem 0",
                  color: "gray",
                  fontSize: "0.8rem",
                  width: "100%",
                }}
              >
                No hay productos pre-seleccionados.
              </Typography>
            )}


            <div style={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
              <Typography
                style={{
                  width: "50%",
                  margin: "1rem 0",
                  color: "black",
                  fontWeight: "bold",
                }}
              >
                Subtotal: ${subtotal}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPriority}
                    onChange={(event) => setIsPriority(event.target.checked)}
                  />
                }
                label="Orden Prioritaria"
                style={{ fontSize: "0.8rem", color: `${isPriority ? "red" : "gray"}`, fontWeight: "bold" }}
              />
            </div>
            <div>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  backgroundColor: "#f9b32d",
                  filter: "brightness(90%)",
                  color: "black",
                  "&:hover": { filter: "none", color: "black" },
                }}
                onClick={confirmarPedido}
              >
                CONFIRMAR PRODUCTOS A COMANDA
              </Button>
            </div>

            {/* PRODUCTOS confirmados */}

            {confirmedProducts?.length > 0 ? (
              <List
                className="custom-scrollbar"
                style={{
                  maxHeight: "12rem",
                  overflowY: "auto",
                  border: "2px solid #856D5E",
                  borderRadius: "5px",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  className="w-2/4flex items-center
                      justify-start m-2 text-[#856D5E]"
                >
                  <h5>Productos confirmados:</h5>
                </div>
                {confirmedProducts?.map((item, index) => (
                  <ListItem
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      height: "2.3rem",
                      margin: "0.3rem 0",
                      color: "#ffffff",
                      borderBottom: "1px solid #856D5E",
                      justifyContent: "space-between",
                    }}
                  >
                    <Tooltip title={item.quantity} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                          maxWidth: "5rem",
                        }}
                        primary={item.quantity}
                      />
                    </Tooltip>
                    <Tooltip title={item.productName} arrow>
                      <ListItemText
                        style={{
                          color: "black",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 1,
                          overflow: "hidden",
                        }}
                        primary={item.productName}
                      />
                    </Tooltip>
                    <Typography style={{ color: "black" }}>
                      ${(item.unitaryPrice ?? 0) * item.quantity}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography
                style={{
                  margin: "1rem 0",
                  color: "gray",
                  fontSize: "0.8rem",
                  width: "100%",
                }}
              >
                No hay productos confirmados.
              </Typography>
            )}
            <Typography
              style={{
                width: "50%",
                margin: "1rem 0",
                color: "black",
                fontWeight: "bold",
              }}
            >
              Total: ${total}
            </Typography>
          </Box>
        </div>
      </div>
    </div >
  );
};

export default OrderEditor;
