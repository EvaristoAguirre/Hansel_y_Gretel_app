import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
  FormControl,
} from '@mui/material';
import {
  ProductForm,
  SlotResponse,
  SlotForPromo,
} from '@/components/Interfaces/IProducts';
import { TabProductKey } from '@/components/Enums/view-products';
import { useAuth } from '@/app/context/authContext';
import { getPromotionSlots } from '@/api/promotionSlot';

interface InputsPromoWithSlotsProps {
  form: ProductForm;
  onSave: (slots: SlotForPromo[]) => void;
  handleSetDisableTabs: (tabs: TabProductKey[]) => void;
}

const InputsPromoWithSlots: React.FC<InputsPromoWithSlotsProps> = ({
  form,
  onSave,
  handleSetDisableTabs,
}) => {
  const { getAccessToken } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<SlotResponse[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<SlotForPromo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar slots disponibles al montar el componente
  useEffect(() => {
    const fetchSlots = async () => {
      const token = getAccessToken();
      if (!token) return;

      setLoading(true);
      setError(null);

      const result = await getPromotionSlots(token);

      if (result.ok && result.data) {
        setAvailableSlots(result.data);
      } else {
        setError(result.error || 'Error al cargar los slots');
      }

      setLoading(false);
    };

    fetchSlots();
  }, [getAccessToken]);

  // Sincronizar slots seleccionados con el form al cargar o cuando cambie
  useEffect(() => {
    if (form.slots && Array.isArray(form.slots) && form.slots.length > 0) {
      // Comparar por contenido, no solo por longitud
      const currentSlotIds = selectedSlots
        .map((s) => s.slotId)
        .sort()
        .join(',');
      const formSlotIds = form.slots
        .map((s) => s.slotId)
        .sort()
        .join(',');

      if (currentSlotIds !== formSlotIds) {
        setSelectedSlots(form.slots);
      }
    } else if (
      (!form.slots || form.slots.length === 0) &&
      selectedSlots.length > 0
    ) {
      // Limpiar si el form no tiene slots pero selectedSlots sí tiene
      setSelectedSlots([]);
    }
  }, [form.slots]);

  // Manejar cambio de selección
  const handleSlotChange = (newValue: SlotResponse[]) => {
    const slotsForPromo: SlotForPromo[] = newValue.map((slot) => ({
      slotId: slot.id,
      name: slot.name,
    }));

    setSelectedSlots(slotsForPromo);
    onSave(slotsForPromo);

    // Deshabilitar otras tabs si hay slots seleccionados
    if (newValue.length > 0) {
      handleSetDisableTabs([
        TabProductKey.SIMPLE_PRODUCT,
        TabProductKey.PRODUCT_WITH_INGREDIENT,
        TabProductKey.PROMO,
      ]);
    } else {
      handleSetDisableTabs([]);
    }
  };

  // Convertir SlotForPromo a SlotResponse para el valor del Autocomplete
  const getValueAsSlotResponse = (): SlotResponse[] => {
    return selectedSlots
      .map((slot) => {
        const found = availableSlots.find((s) => s.id === slot.slotId);
        if (found) return found;
        // Si no se encuentra, crear un objeto temporal
        return {
          id: slot.slotId,
          name: slot.name || '',
          description: '',
          isActive: true,
          products: [],
        } as SlotResponse;
      })
      .filter(Boolean);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        Seleccionar Slots
      </Typography>

      {error && (
        <Typography color="error" variant="body2" mb={1}>
          {error}
        </Typography>
      )}

      <FormControl fullWidth>
        <Autocomplete
          multiple
          options={availableSlots}
          getOptionLabel={(option) => option.name}
          value={getValueAsSlotResponse()}
          onChange={(_, newValue) => handleSlotChange(newValue)}
          loading={loading}
          filterSelectedOptions={false}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Slots"
              variant="outlined"
              placeholder="Selecciona slots"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={`${option.id}-${index}`}
                label={option.name}
                sx={{
                  backgroundColor: '#a8d5ba',
                  color: 'black',
                  fontWeight: 'bold',
                }}
              />
            ))
          }
          isOptionEqualToValue={() => false}
          size="small"
          noOptionsText="No hay slots disponibles"
          loadingText="Cargando slots..."
        />
      </FormControl>

      {selectedSlots.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {selectedSlots.length} slot(s) seleccionado(s)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InputsPromoWithSlots;
