import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  CircularProgress,
  Checkbox,
  Chip,
} from "@mui/material";
import { useAuth } from "@/app/context/authContext";
import { getSlotsByPromotionId } from "@/api/promotionSlot";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";
import { getProductById } from "@/api/products";
import { fetchToppingsGroupById } from "@/api/topping";
import { IProductToppingsGroupResponse } from "../Interfaces/IProducts";
import { ITopping } from "../Interfaces/IToppings";

interface SlotOption {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  extraCost: number;
  isActive: boolean;
}

interface Slot {
  id: string;
  name: string;
  description: string;
  quantity: number;
  isOptional: boolean;
  options: SlotOption[];
}

// Interfaz para una instancia individual de slot (cuando quantity > 1)
interface SlotInstance {
  instanceId: string; // ID único para esta instancia (instance-globalIndex)
  slotId: string; // ID original del slot
  name: string;
  description: string;
  isOptional: boolean;
  options: SlotOption[];
  instanceIndex: number; // Índice de la instancia (1, 2, 3...)
  totalInstances: number; // Total de instancias de este slot
}

interface PromotionSlotSelectorProps {
  open: boolean;
  promotion: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  onConfirm: (
    selections: {
      slotId: string;
      selectedProductId: string;
      toppingsPerUnit?: string[];
    }[]
  ) => void;
  onCancel: () => void;
}

export const PromotionSlotSelector: React.FC<PromotionSlotSelectorProps> = ({
  open,
  promotion,
  quantity,
  onConfirm,
  onCancel,
}) => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();
  // Usar SlotInstance[] para manejar slots repetidos como instancias separadas
  const [slotInstances, setSlotInstances] = useState<SlotInstance[]>([]);
  const [loading, setLoading] = useState(false);
  // Usar instanceId como clave para las selecciones
  const [selections, setSelections] = useState<{
    [instanceId: string]: string;
  }>({});
  // Guardar información completa de productos seleccionados (para obtener availableToppingGroups)
  const [selectedProductsInfo, setSelectedProductsInfo] = useState<{
    [instanceId: string]: {
      productId: string;
      availableToppingGroups?: IProductToppingsGroupResponse[];
    };
  }>({});
  // Guardar toppings seleccionados por instancia: { [instanceId]: { [groupId]: string[] } }
  const [toppingsBySlot, setToppingsBySlot] = useState<{
    [instanceId: string]: { [groupId: string]: string[] };
  }>({});
  // Guardar toppings cargados por grupo: { [groupId]: ITopping[] }
  const [loadedToppings, setLoadedToppings] = useState<{
    [groupId: string]: ITopping[];
  }>({});
  // Controlar visibilidad de grupos de toppings: { [instanceId-groupId]: boolean }
  const [visibleToppingGroups, setVisibleToppingGroups] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (open && promotion.id && token) {
      fetchSlots();
      // Limpiar estados al abrir
      setSelections({});
      setSelectedProductsInfo({});
      setToppingsBySlot({});
      setLoadedToppings({});
      setVisibleToppingGroups({});
    }
  }, [open, promotion.id]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const result = await getSlotsByPromotionId(promotion.id, token!);
      if (result.ok && result.data) {
        // Expandir slots según su quantity en instancias separadas
        // Usar un índice global para evitar keys duplicadas
        const expandedInstances: SlotInstance[] = [];
        let globalIndex = 0;

        // Agrupar slots por ID para calcular totalInstances correctamente
        const slotCounts: { [slotId: string]: number } = {};
        result.data.forEach((slot: Slot) => {
          const qty = slot.quantity || 1;
          slotCounts[slot.id] = (slotCounts[slot.id] || 0) + qty;
        });

        // Contador por slotId para el instanceIndex
        const slotInstanceCounters: { [slotId: string]: number } = {};

        result.data.forEach((slot: Slot) => {
          const qty = slot.quantity || 1;
          for (let i = 0; i < qty; i++) {
            // Inicializar contador si no existe
            if (slotInstanceCounters[slot.id] === undefined) {
              slotInstanceCounters[slot.id] = 0;
            }
            slotInstanceCounters[slot.id]++;

            expandedInstances.push({
              instanceId: `instance-${globalIndex}`, // ID único global
              slotId: slot.id,
              name: slot.name,
              description: slot.description,
              isOptional: slot.isOptional,
              options: slot.options,
              instanceIndex: slotInstanceCounters[slot.id],
              totalInstances: slotCounts[slot.id],
            });
            globalIndex++;
          }
        });
        setSlotInstances(expandedInstances);

        // Inicializar selecciones vacías usando instanceId
        const initialSelections: { [instanceId: string]: string } = {};
        expandedInstances.forEach((instance) => {
          if (
            instance.options &&
            instance.options.length > 0 &&
            !instance.isOptional
          ) {
            // Seleccionar primera opción por defecto si no es opcional
            initialSelections[instance.instanceId] =
              instance.options[0].productId;
          }
        });
        setSelections(initialSelections);
      }
    } catch (error) {
      console.error("Error al obtener slots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = async (
    instanceId: string,
    productId: string
  ) => {
    setSelections((prev) => ({
      ...prev,
      [instanceId]: productId,
    }));

    // Limpiar toppings de la instancia anterior
    setToppingsBySlot((prev) => {
      const newState = { ...prev };
      delete newState[instanceId];
      return newState;
    });

    // Obtener información completa del producto para saber si tiene toppings
    if (token) {
      try {
        const productResult = await getProductById(productId, token);
        if (productResult.ok && productResult.data) {
          const product = productResult.data;
          setSelectedProductsInfo((prev) => ({
            ...prev,
            [instanceId]: {
              productId: product.id,
              availableToppingGroups: product.availableToppingGroups || [],
            },
          }));
        }
      } catch (error) {
        console.error("Error al obtener información del producto:", error);
      }
    }
  };

  const handleToggleToppingGroup = async (
    instanceId: string,
    groupId: string
  ) => {
    const key = `${instanceId}-${groupId}`;
    setVisibleToppingGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    // Cargar toppings del grupo si no están cargados
    if (!loadedToppings[groupId] && token) {
      try {
        const groupData = await fetchToppingsGroupById(token, groupId);
        if (groupData?.toppings) {
          setLoadedToppings((prev) => ({
            ...prev,
            [groupId]: groupData.toppings,
          }));
        }
      } catch (error) {
        console.error("Error al cargar toppings del grupo:", error);
      }
    }
  };

  const handleToppingChange = (
    instanceId: string,
    groupId: string,
    toppingId: string,
    checked: boolean,
    maxSelection: number
  ) => {
    setToppingsBySlot((prev) => {
      const instanceToppings = prev[instanceId] || {};
      const groupToppings = instanceToppings[groupId] || [];

      let newGroupToppings: string[];
      if (checked) {
        if (groupToppings.length >= maxSelection) {
          return prev; // No se puede agregar más
        }
        newGroupToppings = [...groupToppings, toppingId];
      } else {
        newGroupToppings = groupToppings.filter((id) => id !== toppingId);
      }

      return {
        ...prev,
        [instanceId]: {
          ...instanceToppings,
          [groupId]: newGroupToppings,
        },
      };
    });
  };

  const handleConfirm = () => {
    // Validar que todas las instancias obligatorias tengan selección
    const requiredInstances = slotInstances.filter(
      (instance) => !instance.isOptional
    );
    const missingInstances = requiredInstances.filter(
      (instance) => !selections[instance.instanceId]
    );

    if (missingInstances.length > 0) {
      alert(
        `Por favor selecciona productos para: ${missingInstances
          .map((s) =>
            s.totalInstances > 1 ? `${s.name} (${s.instanceIndex})` : s.name
          )
          .join(", ")}`
      );
      return;
    }

    // Convertir selecciones a formato de array, incluyendo toppings
    // Usar el slotId original (no el instanceId) para el resultado
    const selectionsArray = Object.entries(selections).map(
      ([instanceId, selectedProductId]) => {
        const instanceToppings = toppingsBySlot[instanceId] || {};
        // Convertir toppings de formato { [groupId]: string[] } a string[] (flat)
        const toppingsPerUnit = Object.values(instanceToppings).flat();

        // Buscar la instancia para obtener el slotId original
        const instance = slotInstances.find((i) => i.instanceId === instanceId);
        const slotId = instance?.slotId || "";

        return {
          slotId,
          selectedProductId,
          toppingsPerUnit:
            toppingsPerUnit.length > 0 ? toppingsPerUnit : undefined,
        };
      }
    );

    onConfirm(selectionsArray);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "8px",
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
          variant="subtitle1"
          fontWeight="bold"
          display="block"
        >
          {capitalizeFirstLetter(promotion.name)} - Seleccionar Opciones
        </Typography>
        <Typography component="span" variant="caption" sx={{ opacity: 0.9 }}>
          Cantidad: {quantity}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : slotInstances.length === 0 ? (
          <Typography sx={{ textAlign: "center", py: 2, color: "gray" }}>
            No hay slots disponibles para esta promoción
          </Typography>
        ) : (
          slotInstances.map((instance, index) => (
            <Box key={instance.instanceId} sx={{ mb: 2 }}>
              <Typography
                variant="body1"
                sx={{ fontWeight: "bold", color: "#856D5E", mb: 0.5 }}
              >
                {capitalizeFirstLetter(instance.name)}
                {instance.totalInstances > 1 && (
                  <Typography
                    component="span"
                    sx={{ ml: 1, fontSize: "0.8rem", color: "#856D5E" }}
                  >
                    ({instance.instanceIndex}/{instance.totalInstances})
                  </Typography>
                )}
                {instance.isOptional && (
                  <Typography
                    component="span"
                    sx={{ ml: 1, fontSize: "0.75rem", color: "gray" }}
                  >
                    (Opcional)
                  </Typography>
                )}
              </Typography>
              {instance.description && (
                <Typography
                  variant="caption"
                  sx={{ color: "gray", display: "block", mb: 0.5 }}
                >
                  {instance.description}
                </Typography>
              )}
              <RadioGroup
                name={`slot-radio-group-${instance.instanceId}`}
                value={selections[instance.instanceId] || ""}
                onChange={(e) =>
                  handleSelectionChange(instance.instanceId, e.target.value)
                }
                sx={{ gap: 0 }}
              >
                {instance.options
                  ?.filter((option) => option.isActive)
                  .map((option) => (
                    <FormControlLabel
                      key={`${instance.instanceId}-${option.id}`}
                      value={option.productId}
                      sx={{ my: -0.25 }}
                      control={
                        <Radio
                          size="small"
                          sx={{
                            color: "#856D5E",
                            "&.Mui-checked": {
                              color: "#856D5E",
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="body2">
                            {capitalizeFirstLetter(option.product.name)}
                          </Typography>
                          {option.extraCost > 0 && (
                            <Typography
                              variant="body2"
                              sx={{
                                ml: 1,
                                color: "#856D5E",
                                fontWeight: "bold",
                              }}
                            >
                              (+${option.extraCost.toFixed(2)})
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
              </RadioGroup>

              {/* Selector de toppings para el producto seleccionado */}
              {selections[instance.instanceId] &&
                selectedProductsInfo[instance.instanceId]
                  ?.availableToppingGroups &&
                selectedProductsInfo[instance.instanceId]
                  .availableToppingGroups!.length > 0 && (
                  <Box sx={{ mt: 1, pl: 1.5, borderLeft: "2px solid #d4c0b3" }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "#856D5E" }}
                    >
                      Agregados disponibles:
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      {selectedProductsInfo[
                        instance.instanceId
                      ].availableToppingGroups!.map((group) => {
                        const groupKey = `${instance.instanceId}-${group.id}`;
                        const isVisible =
                          visibleToppingGroups[groupKey] || false;
                        const instanceToppings =
                          toppingsBySlot[instance.instanceId] || {};
                        const selectedGroupToppings =
                          instanceToppings[group.id] || [];
                        const groupToppings = loadedToppings[group.id] || [];

                        return (
                          <Box
                            key={group.id}
                            sx={{
                              flex: "1 1 calc(50% - 0.25rem)",
                              backgroundColor: "#856d5e52",
                              borderRadius: "6px",
                              padding: "0.5rem",
                              border: "1px solid #856D5E",
                            }}
                          >
                            <Chip
                              label={capitalizeFirstLetter(group.name)}
                              size="small"
                              onClick={() =>
                                handleToggleToppingGroup(
                                  instance.instanceId,
                                  group.id
                                )
                              }
                              sx={{
                                marginBottom: "0.25rem",
                                border: "1px solid #856D5E",
                                fontWeight: 500,
                                cursor: "pointer",
                                backgroundColor: "#ffffffa8",
                                "&:hover": {
                                  backgroundColor: "#ffffff",
                                },
                              }}
                            />

                            {isVisible && groupToppings.length > 0 && (
                              <Box sx={{ pl: 0.5 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "gray", fontSize: "0.7rem" }}
                                >
                                  Máx: {group.settings.maxSelection}
                                </Typography>
                                <Divider sx={{ my: 0.25 }} />
                                {groupToppings.map((topping) => {
                                  const isChecked =
                                    selectedGroupToppings.includes(topping.id);

                                  return (
                                    <FormControlLabel
                                      key={topping.id}
                                      sx={{ my: -0.5, display: "flex" }}
                                      control={
                                        <Checkbox
                                          checked={isChecked}
                                          onChange={(e) =>
                                            handleToppingChange(
                                              instance.instanceId,
                                              group.id,
                                              topping.id,
                                              e.target.checked,
                                              group.settings.maxSelection
                                            )
                                          }
                                          size="small"
                                          sx={{
                                            color: "#856D5E",
                                            p: 0.5,
                                            "&.Mui-checked": {
                                              color: "#856D5E",
                                            },
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography
                                          variant="caption"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          {capitalizeFirstLetter(topping.name)}
                                          {group.settings.chargeExtra &&
                                            group.settings.extraCost > 0 && (
                                              <Typography
                                                component="span"
                                                variant="caption"
                                                sx={{
                                                  color: "#9e0404",
                                                  ml: 0.5,
                                                }}
                                              >
                                                (+$
                                                {group.settings.extraCost.toFixed(
                                                  2
                                                )}
                                                )
                                              </Typography>
                                            )}
                                        </Typography>
                                      }
                                    />
                                  );
                                })}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

              {index < slotInstances.length - 1 && (
                <Divider sx={{ mt: 1.5, borderColor: "#d4c0b3" }} />
              )}
            </Box>
          ))
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid #d4c0b3" }}>
        <Button
          onClick={onCancel}
          size="small"
          sx={{
            color: "#856D5E",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="small"
          sx={{
            backgroundColor: "#f9b32d",
            color: "black",
            "&:hover": {
              backgroundColor: "#f9b32d",
              filter: "brightness(90%)",
            },
          }}
          disabled={loading || slotInstances.length === 0}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
