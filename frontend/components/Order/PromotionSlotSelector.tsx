import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useAuth } from '@/app/context/authContext';
import { getSlotsByPromotionId } from '@/api/promotionSlot';
import { capitalizeFirstLetter } from '../Utils/CapitalizeFirstLetter';
import { getProductById } from '@/api/products';
import { fetchToppingsGroupById } from '@/api/topping';
import { IProductToppingsGroupResponse } from '../Interfaces/IProducts';
import { ITopping } from '../Interfaces/IToppings';

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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState<{ [slotId: string]: string }>(
    {}
  );
  // Guardar información completa de productos seleccionados (para obtener availableToppingGroups)
  const [selectedProductsInfo, setSelectedProductsInfo] = useState<{
    [slotId: string]: {
      productId: string;
      availableToppingGroups?: IProductToppingsGroupResponse[];
    };
  }>({});
  // Guardar toppings seleccionados por slot: { [slotId]: { [groupId]: string[] } }
  const [toppingsBySlot, setToppingsBySlot] = useState<{
    [slotId: string]: { [groupId: string]: string[] };
  }>({});
  // Guardar toppings cargados por grupo: { [groupId]: ITopping[] }
  const [loadedToppings, setLoadedToppings] = useState<{
    [groupId: string]: ITopping[];
  }>({});
  // Controlar visibilidad de grupos de toppings: { [slotId-groupId]: boolean }
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
        setSlots(result.data);
        // Inicializar selecciones vacías
        const initialSelections: { [slotId: string]: string } = {};
        result.data.forEach((slot: Slot) => {
          if (slot.options && slot.options.length > 0 && !slot.isOptional) {
            // Seleccionar primera opción por defecto si no es opcional
            initialSelections[slot.id] = slot.options[0].productId;
          }
        });
        setSelections(initialSelections);
      }
    } catch (error) {
      console.error('Error al obtener slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = async (
    slotId: string,
    productId: string
  ) => {
    setSelections((prev) => ({
      ...prev,
      [slotId]: productId,
    }));

    // Limpiar toppings del slot anterior
    setToppingsBySlot((prev) => {
      const newState = { ...prev };
      delete newState[slotId];
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
            [slotId]: {
              productId: product.id,
              availableToppingGroups: product.availableToppingGroups || [],
            },
          }));
        }
      } catch (error) {
        console.error('Error al obtener información del producto:', error);
      }
    }
  };

  const handleToggleToppingGroup = async (
    slotId: string,
    groupId: string
  ) => {
    const key = `${slotId}-${groupId}`;
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
        console.error('Error al cargar toppings del grupo:', error);
      }
    }
  };

  const handleToppingChange = (
    slotId: string,
    groupId: string,
    toppingId: string,
    checked: boolean,
    maxSelection: number
  ) => {
    setToppingsBySlot((prev) => {
      const slotToppings = prev[slotId] || {};
      const groupToppings = slotToppings[groupId] || [];

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
        [slotId]: {
          ...slotToppings,
          [groupId]: newGroupToppings,
        },
      };
    });
  };

  const handleConfirm = () => {
    // Validar que todos los slots obligatorios tengan selección
    const requiredSlots = slots.filter((slot) => !slot.isOptional);
    const missingSlots = requiredSlots.filter((slot) => !selections[slot.id]);

    if (missingSlots.length > 0) {
      alert(
        `Por favor selecciona productos para: ${missingSlots
          .map((s) => s.name)
          .join(', ')}`
      );
      return;
    }

    // Convertir selecciones a formato de array, incluyendo toppings
    const selectionsArray = Object.entries(selections).map(
      ([slotId, selectedProductId]) => {
        const slotToppings = toppingsBySlot[slotId] || {};
        // Convertir toppings de formato { [groupId]: string[] } a string[] (flat)
        const toppingsPerUnit = Object.values(slotToppings).flat();

        return {
          slotId,
          selectedProductId,
          toppingsPerUnit: toppingsPerUnit.length > 0 ? toppingsPerUnit : undefined,
        };
      }
    );

    onConfirm(selectionsArray);
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#856D5E',
          color: '#ffffff',
          textAlign: 'center',
          py: 2,
        }}
      >
        <Typography variant="h6">
          {capitalizeFirstLetter(promotion.name)} - Seleccionar Opciones
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          Cantidad: {quantity}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, minHeight: '400px' }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : slots.length === 0 ? (
          <Typography sx={{ textAlign: 'center', py: 4, color: 'gray' }}>
            No hay slots disponibles para esta promoción
          </Typography>
        ) : (
          slots.map((slot, index) => (
            <Box key={slot.id} sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 'bold', color: '#856D5E' }}
                >
                  {capitalizeFirstLetter(slot.name)}
                  {slot.isOptional && (
                    <Typography
                      component="span"
                      sx={{ ml: 1, fontSize: '0.8rem', color: 'gray' }}
                    >
                      (Opcional)
                    </Typography>
                  )}
                </Typography>
              </Box>
              {slot.description && (
                <Typography variant="body2" sx={{ mb: 1, color: 'gray' }}>
                  {slot.description}
                </Typography>
              )}
              <RadioGroup
                value={selections[slot.id] || ''}
                onChange={(e) => handleSelectionChange(slot.id, e.target.value)}
              >
                {slot.options
                  ?.filter((option) => option.isActive)
                  .map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.productId}
                      control={
                        <Radio
                          sx={{
                            color: '#856D5E',
                            '&.Mui-checked': {
                              color: '#856D5E',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography>
                            {capitalizeFirstLetter(option.product.name)}
                          </Typography>
                          {option.extraCost > 0 && (
                            <Typography
                              sx={{
                                ml: 1,
                                color: '#856D5E',
                                fontWeight: 'bold',
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
              {selections[slot.id] &&
                selectedProductsInfo[slot.id]?.availableToppingGroups &&
                selectedProductsInfo[slot.id].availableToppingGroups!.length >
                  0 && (
                  <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid #d4c0b3' }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 1, color: '#856D5E' }}
                    >
                      Agregados disponibles:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedProductsInfo[slot.id].availableToppingGroups!.map(
                        (group) => {
                          const groupKey = `${slot.id}-${group.id}`;
                          const isVisible =
                            visibleToppingGroups[groupKey] || false;
                          const slotToppings = toppingsBySlot[slot.id] || {};
                          const selectedGroupToppings =
                            slotToppings[group.id] || [];
                          const groupToppings = loadedToppings[group.id] || [];

                          return (
                            <Box
                              key={group.id}
                              sx={{
                                flex: '1 1 calc(50% - 0.5rem)',
                                backgroundColor: '#856d5e52',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                border: '1px solid #856D5E',
                              }}
                            >
                              <Chip
                                label={capitalizeFirstLetter(group.name)}
                                onClick={() =>
                                  handleToggleToppingGroup(slot.id, group.id)
                                }
                                sx={{
                                  marginBottom: '0.5rem',
                                  border: '1px solid #856D5E',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  backgroundColor: '#ffffffa8',
                                  '&:hover': {
                                    backgroundColor: '#ffffff',
                                  },
                                }}
                              />

                              {isVisible && groupToppings.length > 0 && (
                                <Box sx={{ pl: 1 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      mb: 0.5,
                                      color: 'gray',
                                    }}
                                  >
                                    Máxima selección: {group.settings.maxSelection}
                                  </Typography>
                                  <Divider sx={{ mb: 0.5 }} />
                                  {groupToppings.map((topping) => {
                                    const isChecked =
                                      selectedGroupToppings.includes(topping.id);

                                    return (
                                      <FormControlLabel
                                        key={topping.id}
                                        control={
                                          <Checkbox
                                            checked={isChecked}
                                            onChange={(e) =>
                                              handleToppingChange(
                                                slot.id,
                                                group.id,
                                                topping.id,
                                                e.target.checked,
                                                group.settings.maxSelection
                                              )
                                            }
                                            size="small"
                                            sx={{
                                              color: '#856D5E',
                                              '&.Mui-checked': {
                                                color: '#856D5E',
                                              },
                                            }}
                                          />
                                        }
                                        label={
                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{ fontWeight: 500 }}
                                            >
                                              {capitalizeFirstLetter(topping.name)}
                                            </Typography>
                                            {group.settings.chargeExtra &&
                                              group.settings.extraCost > 0 && (
                                                <Typography
                                                  variant="caption"
                                                  sx={{
                                                    color: '#9e0404',
                                                    fontStyle: 'italic',
                                                  }}
                                                >
                                                  + ${group.settings.extraCost.toFixed(
                                                    2
                                                  )}{' '}
                                                  adicional
                                                </Typography>
                                              )}
                                          </Box>
                                        }
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                            </Box>
                          );
                        }
                      )}
                    </Box>
                  </Box>
                )}

              {index < slots.length - 1 && (
                <Divider sx={{ mt: 2, borderColor: '#d4c0b3' }} />
              )}
            </Box>
          ))
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #d4c0b3' }}>
        <Button
          onClick={onCancel}
          sx={{
            color: '#856D5E',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          sx={{
            backgroundColor: '#f9b32d',
            color: 'black',
            '&:hover': {
              backgroundColor: '#f9b32d',
              filter: 'brightness(90%)',
            },
          }}
          disabled={loading || slots.length === 0}
        >
          Confirmar Selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};
