import React, { use, useEffect, useState } from "react";
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add,
  Remove,
  Delete,
  Comment,
  AutoAwesome,
  SpaceBar,
} from "@mui/icons-material";
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
import { fetchToppingsGroupById } from "@/api/topping";
import ToppingsGroupsViewer from "./ToppingsSection.tsx/ToppingsGroupsViewer";
import { formatNumber } from "../Utils/FormatNumber";
import { normalizeNumber } from "../Utils/NormalizeNumber";
import { ProductResponse, SelectedProductsI } from "../Interfaces/IProducts";
import { TypeProduct } from "../Enums/view-products";
import { PromotionSlotSelector } from "./PromotionSlotSelector";
import { getSlotsByPromotionId } from "@/api/promotionSlot";
// import ToppingsGroupsViewer from "./ToppingsSection.tsx/ToppingsGroupsViewer";

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
const OrderEditor = ({ handleNextStep, handleCompleteStep }: Props) => {
  const { productosDisponibles, setProductosDisponibles } = useOrder();
  const { fetchAndSetProducts, products } = useProducts();
  const { getAccessToken } = useAuth();

  // Agregar al inicio del componente:
  const [promotionSlotModal, setPromotionSlotModal] = useState<{
    open: boolean;
    promotion: ProductResponse | null;
    quantity: number;
  }>({
    open: false,
    promotion: null,
    quantity: 1,
  });

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
    selectedToppingsByProduct,
    toppingsByProductGroup,
  } = useOrderContext();

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [visibleCommentInputs, setVisibleCommentInputs] = useState<{
    [key: string]: boolean;
  }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [categories, setCategories] = useState<ICategory[]>([]);
  const token = getAccessToken();
  const [isPriority, setIsPriority] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  useEffect(() => {
    token &&
      fetchCategories(token).then((categories = []) =>
        setCategories(categories)
      );
  }, []);

  const confirmarPedido: () => Promise<void> = async () => {
    const productDetails = selectedProducts.map((product) => {
      const baseDetail: any = {
        productId: product.productId,
        quantity: product.quantity,
        toppingsPerUnit: selectedToppingsByProduct[product.productId] ?? [],
        commentOfProduct: commentInputs[product.productId],
      };

      // Si el producto tiene selecciones de slots, transformarlas al formato del backend
      if (product.slotSelections && product.slotSelections.length > 0) {
        // Cada selección es un elemento separado (sin agrupar por slotId)
        // Esto permite que slots repetidos tengan selecciones independientes
        const promotionSelections = product.slotSelections.map((selection) => ({
          slotId: selection.slotId,
          selectedProductIds: [selection.selectedProductId],
          // toppingsPerUnit como array de arrays (un array por cada producto)
          // Siempre enviar el array, incluso si está vacío
          toppingsPerUnit: [selection.toppingsPerUnit || []],
        }));

        baseDetail.promotionSelections = promotionSelections;
      }

      return baseDetail;
    }) as SelectedProductsI[]; // Cast para compatibilidad con handleEditOrder

    if (selectedOrderByTable) {
      setLoading(true);
      try {
        await handleEditOrder(
          selectedOrderByTable.id,
          productDetails,
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

  const calcularPrecioConToppings = (
    product: any,
    quantity: number,
    toppingsByUnit: any[]
  ) => {
    let toppingExtra = 0;

    if (toppingsByUnit && product.availableToppingGroups) {
      product.availableToppingGroups.forEach((group: any) => {
        const { id: groupId, settings } = group;

        if (settings.chargeExtra && settings.extraCost) {
          toppingsByUnit.forEach((unitToppings: any) => {
            const selected = unitToppings[groupId] || [];
            toppingExtra += selected.length * settings.extraCost;
          });
        }
      });
    }

    // Primero normalizar unitaryPrice a número
    const unitaryPriceNum = normalizeNumber(product.unitaryPrice);

    const basePrice = unitaryPriceNum * quantity;
    const totalPrice = basePrice + toppingExtra;
    const formattedPrice = formatNumber(totalPrice);

    return formattedPrice;
  };

  const calcularPrecioConToppingsNumero = (
    product: any,
    quantity: number,
    toppingsByUnit: any[]
  ): number => {
    let toppingExtra = 0;

    if (toppingsByUnit && product.availableToppingGroups) {
      product.availableToppingGroups.forEach((group: any) => {
        const { id: groupId, settings } = group;

        if (settings.chargeExtra && settings.extraCost) {
          toppingsByUnit.forEach((unitToppings: any) => {
            const selected = unitToppings[groupId] || [];
            toppingExtra += selected.length * settings.extraCost;
          });
        }
      });
    }

    const unitaryPriceNum = normalizeNumber(product.unitaryPrice);

    return unitaryPriceNum * quantity + toppingExtra;
  };

  useEffect(() => {
    const calcularSubtotal = () => {
      const subtotal = selectedProducts.reduce((acc, product) => {
        const toppings = toppingsByProductGroup[product.productId] ?? [];
        return (
          acc +
          calcularPrecioConToppingsNumero(product, product.quantity, toppings)
        );
      }, 0);
      setSubtotal(subtotal);
    };

    const calculateTotal = () => {
      const total = confirmedProducts.reduce((acc, product) => {
        const toppings = toppingsByProductGroup[product.productId] ?? [];
        return (
          acc +
          calcularPrecioConToppingsNumero(product, product.quantity, toppings)
        );
      }, 0);
      setTotal(total);
    };

    calcularSubtotal();
    calculateTotal();
  }, [selectedProducts, confirmedProducts, toppingsByProductGroup]);

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
    handleDeleteSelectedProduct(productId);
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
    const results =
      token && (await searchProducts(trimmedTerm, token, categories.join(",")));
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

  const [visibleToppings, setVisibleToppings] = useState<{
    [productId: string]: boolean;
  }>({});
  const handleShowToppings = (productId: string) => {
    setVisibleToppings((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Función auxiliar para obtener los nombres de los toppings seleccionados de un producto normal
  const getToppingNamesForProduct = (item: SelectedProductsI): string[] => {
    const productToppings = toppingsByProductGroup[item.productId];
    if (!productToppings || !item.availableToppingGroups) return [];

    const toppingNames: string[] = [];

    // Recorrer cada unidad del producto
    productToppings.forEach((unitToppings) => {
      // Recorrer cada grupo de toppings
      Object.entries(unitToppings).forEach(([groupId, toppingIds]) => {
        // Buscar el grupo en availableToppingGroups
        const group = item.availableToppingGroups?.find(
          (g) => g.id === groupId
        );
        if (group && group.toppings) {
          // Buscar cada topping seleccionado
          (toppingIds as string[]).forEach((toppingId) => {
            const topping = group.toppings.find((t: any) => t.id === toppingId);
            if (topping && !toppingNames.includes(topping.name)) {
              toppingNames.push(topping.name);
            }
          });
        }
      });
    });

    return toppingNames;
  };

  // Función para manejar la selección de productos, detectando promociones con slots
  const handleProductSelection = async (product: ProductResponse) => {
    // Verificar si es una promoción
    if (product.type === TypeProduct.PROMO) {
      // Verificar si tiene slots
      if (token) {
        try {
          const slotsResult = await getSlotsByPromotionId(product.id, token);
          if (
            slotsResult.ok &&
            slotsResult.data &&
            slotsResult.data.length > 0
          ) {
            // Tiene slots, abrir modal de selección
            setPromotionSlotModal({
              open: true,
              promotion: product,
              quantity: 1,
            });
            return;
          }
        } catch (error) {
          console.error("Error al verificar slots de promoción:", error);
          // Si hay error, continuar con el flujo normal
        }
      }
    }

    // Si no es promoción con slots, usar el flujo normal
    await handleSelectedProducts(product);
  };

  // Función para manejar la confirmación de selección de slots
  const handleConfirmSlotSelection = async (
    selections: {
      slotId: string;
      selectedProductId: string;
      selectedProductName?: string;
      toppingsPerUnit?: string[];
      toppingNames?: string[];
    }[]
  ) => {
    if (!promotionSlotModal.promotion) return;

    const promotion = promotionSlotModal.promotion;
    const quantity = promotionSlotModal.quantity;

    // Crear el producto con las selecciones de slots (incluyendo toppings)
    const newProduct = {
      productId: promotion.id,
      quantity: quantity,
      unitaryPrice: promotion.price,
      productName: promotion.name,
      allowsToppings: promotion.allowsToppings,
      commentOfProduct: promotion.commentOfProduct,
      availableToppingGroups: promotion.availableToppingGroups,
      slotSelections: selections, // Guardar selecciones de slots con toppings
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    setPromotionSlotModal({ open: false, promotion: null, quantity: 1 });
  };

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
              onSelect={handleProductSelection}
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
                        <IconButton
                          size="small"
                          sx={{ padding: "4px" }}
                          onClick={() => decreaseProductNumber(item.productId)}
                        >
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
                        <IconButton
                          size="small"
                          sx={{ padding: "4px" }}
                          onClick={() => increaseProductNumber(item)}
                        >
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
                          primary={capitalizeFirstLetter(
                            item.productName ?? ""
                          )}
                        />
                      </Tooltip>

                      <Typography style={{ color: "black" }}>
                        $
                        {calcularPrecioConToppings(
                          item,
                          item.quantity,
                          toppingsByProductGroup[item.productId] ?? []
                        )}
                      </Typography>

                      {/* ICON DE AGREGADOS */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {item.allowsToppings && (
                          <Tooltip title="Agregados" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                handleShowToppings(item.productId);
                                removeHighlightedProduct(item.productId);
                              }}
                              sx={{
                                "@keyframes heartbeat": {
                                  "0%": { transform: "scale(1)" },
                                  "14%": { transform: "scale(1.3)" },
                                  "28%": { transform: "scale(1)" },
                                  "42%": { transform: "scale(1.3)" },
                                  "70%": { transform: "scale(1)" },
                                },
                                animation: highlightedProducts.has(
                                  item.productId
                                )
                                  ? "heartbeat 2.2s infinite ease-in-out"
                                  : "none",
                              }}
                            >
                              <AutoAwesome />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Comentarios" arrow>
                          <IconButton
                            onClick={() => toggleCommentInput(item.productId)}
                          >
                            <Comment style={{ color: "#856D5E" }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" arrow>
                          <IconButton
                            onClick={() =>
                              handleDeleteProductAndComment(item.productId)
                            }
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Comentario */}
                    {visibleCommentInputs[item.productId] && (
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
                            productComment(
                              item.productId,
                              commentInputs[item.productId] || ""
                            )
                          }
                        />
                      </div>
                    )}
                    {/* ::::::::::::::::::::::::::::: */}
                    {/* AGREGADOS */}
                    {visibleToppings[item.productId] && (
                      <ToppingsGroupsViewer
                        groups={item.availableToppingGroups ?? []}
                        fetchGroupById={(id: string) =>
                          fetchToppingsGroupById(token as string, id)
                        }
                        productId={item.productId}
                      />
                    )}
                    <Divider color="#856D5E" sx={{ marginTop: "10px" }} />
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                flexDirection: "row",
              }}
            >
              <Typography
                style={{
                  width: "50%",
                  margin: "1rem 0",
                  color: "black",
                  fontWeight: "bold",
                }}
              >
                Subtotal: ${formatNumber(subtotal)}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPriority}
                    onChange={(event) => setIsPriority(event.target.checked)}
                  />
                }
                label="Orden Prioritaria"
                style={{
                  fontSize: "0.8rem",
                  color: `${isPriority ? "red" : "gray"}`,
                  fontWeight: "bold",
                }}
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
                onClick={() => setConfirmModalOpen(true)}
                disabled={selectedProducts.length === 0}
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
                      $
                      {formatNumber(
                        normalizeNumber(item.unitaryPrice) * item.quantity
                      )}
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
              Total: ${formatNumber(total)}
            </Typography>
          </Box>
        </div>
      </div>

      {/* Modal de selección de slots para promociones */}
      <PromotionSlotSelector
        open={promotionSlotModal.open}
        promotion={
          promotionSlotModal.promotion
            ? {
                id: promotionSlotModal.promotion.id,
                name: promotionSlotModal.promotion.name,
                price: parseFloat(promotionSlotModal.promotion.price),
              }
            : { id: "", name: "", price: 0 }
        }
        quantity={promotionSlotModal.quantity}
        onConfirm={handleConfirmSlotSelection}
        onCancel={() =>
          setPromotionSlotModal({ open: false, promotion: null, quantity: 1 })
        }
      />

      {/* Modal de confirmación del pedido */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "8px",
            maxHeight: "85vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#856D5E",
            color: "#ffffff",
            textAlign: "center",
            py: 1.5,
          }}
        >
          <Typography
            component="span"
            variant="h6"
            fontWeight="bold"
            display="block"
          >
            Resumen del Pedido
          </Typography>
          {selectedOrderByTable?.table?.name && (
            <Typography
              component="span"
              variant="caption"
              sx={{ opacity: 0.9 }}
            >
              Mesa: {selectedOrderByTable.table.name}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {/* Productos a agregar (sin confirmar) */}
          {selectedProducts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "#856D5E",
                  mb: 1,
                  borderBottom: "2px solid #f9b32d",
                  pb: 0.5,
                }}
              >
                Productos a agregar ({selectedProducts.length})
              </Typography>
              <List dense sx={{ py: 0 }}>
                {selectedProducts.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      py: 0.5,
                      px: 1,
                      backgroundColor:
                        index % 2 === 0 ? "#f9f6f3" : "transparent",
                      borderRadius: "4px",
                      flexDirection: "column",
                      alignItems: "stretch",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          sx={{
                            backgroundColor: "#856D5E",
                            color: "#fff",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {capitalizeFirstLetter(item.productName ?? "")}
                            {/* Mostrar toppings de productos normales */}
                            {!item.slotSelections &&
                              getToppingNamesForProduct(item).length > 0 && (
                                <Typography
                                  component="span"
                                  sx={{
                                    color: "#856D5E",
                                    fontSize: "0.7rem",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {" "}
                                  +{" "}
                                  {getToppingNamesForProduct(item)
                                    .map((name) => capitalizeFirstLetter(name))
                                    .join(" + ")}
                                </Typography>
                              )}
                          </Typography>
                          {item.slotSelections &&
                            item.slotSelections.length > 0 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#f9b32d",
                                  fontWeight: "bold",
                                  fontSize: "0.65rem",
                                }}
                              >
                                PROMO
                              </Typography>
                            )}
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", color: "#856D5E" }}
                      >
                        $
                        {calcularPrecioConToppings(
                          item,
                          item.quantity,
                          toppingsByProductGroup[item.productId] ?? []
                        )}
                      </Typography>
                    </Box>
                    {/* Mostrar productos de la promoción */}
                    {item.slotSelections && item.slotSelections.length > 0 && (
                      <Box
                        sx={{
                          mt: 0.5,
                          ml: 4,
                          pl: 1,
                          borderLeft: "2px solid #f9b32d",
                        }}
                      >
                        {item.slotSelections.map((selection, selIndex) => (
                          <Typography
                            key={selIndex}
                            variant="caption"
                            sx={{
                              display: "block",
                              color: "#5a4a40",
                              fontSize: "0.7rem",
                            }}
                          >
                            •{" "}
                            {capitalizeFirstLetter(
                              selection.selectedProductName || "Producto"
                            )}
                            {selection.toppingNames &&
                              selection.toppingNames.length > 0 && (
                                <Typography
                                  component="span"
                                  sx={{
                                    color: "#856D5E",
                                    fontSize: "0.65rem",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {" "}
                                  +{" "}
                                  {selection.toppingNames
                                    .map((name) => capitalizeFirstLetter(name))
                                    .join(" + ")}
                                </Typography>
                              )}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                  pt: 1,
                  borderTop: "1px dashed #d4c0b3",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Subtotal a agregar:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "#856D5E" }}
                >
                  ${formatNumber(subtotal)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Productos ya confirmados */}
          {confirmedProducts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: "bold",
                  color: "#856D5E",
                  mb: 1,
                  borderBottom: "2px solid #856D5E",
                  pb: 0.5,
                }}
              >
                Productos ya confirmados ({confirmedProducts.length})
              </Typography>
              <List
                dense
                sx={{
                  py: 0,
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
                className="custom-scrollbar"
              >
                {confirmedProducts.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      py: 0.5,
                      px: 1,
                      backgroundColor:
                        index % 2 === 0 ? "#f0ebe7" : "transparent",
                      borderRadius: "4px",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          sx={{
                            backgroundColor: "#d4c0b3",
                            color: "#5a4a40",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                          }}
                        >
                          {item.quantity}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#5a4a40" }}>
                          {capitalizeFirstLetter(item.productName ?? "")}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: "#856D5E" }}>
                        $
                        {formatNumber(
                          normalizeNumber(item.unitaryPrice) * item.quantity
                        )}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mt: 1,
                  pt: 1,
                  borderTop: "1px dashed #d4c0b3",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Total confirmado:
                </Typography>
                <Typography variant="body2" sx={{ color: "#856D5E" }}>
                  ${formatNumber(total)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Prioridad */}
          {isPriority && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "4px",
                p: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: "#856404", fontWeight: "bold" }}
              >
                ORDEN PRIORITARIA
              </Typography>
            </Box>
          )}

          {/* Total General */}
          <Divider
            sx={{ my: 1.5, borderColor: "#856D5E", borderWidth: "2px" }}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#856D5E",
              color: "#ffffff",
              borderRadius: "6px",
              p: 1.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              TOTAL GENERAL:
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              ${formatNumber(subtotal + total)}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: "1px solid #d4c0b3",
            gap: 1,
          }}
        >
          <Button
            onClick={() => setConfirmModalOpen(false)}
            size="medium"
            sx={{
              color: "#856D5E",
              borderColor: "#856D5E",
              "&:hover": {
                backgroundColor: "#f5f5f5",
                borderColor: "#856D5E",
              },
            }}
            variant="outlined"
          >
            Cerrar
          </Button>
          <Button
            onClick={async () => {
              setConfirmModalOpen(false);
              await confirmarPedido();
            }}
            variant="contained"
            size="medium"
            sx={{
              backgroundColor: "#f9b32d",
              color: "black",
              fontWeight: "bold",
              px: 3,
              "&:hover": {
                backgroundColor: "#f9b32d",
                filter: "brightness(90%)",
              },
            }}
          >
            CONFIRMAR PEDIDO
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default OrderEditor;
