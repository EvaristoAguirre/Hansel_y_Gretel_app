import {
  Autocomplete,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Tooltip,
  Chip,
  Box,
} from '@mui/material';
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { ToppingsGroupWithoutToppings } from "@/api/topping";
import { ProductToppingsGroupDto } from "@/components/Interfaces/IProducts";
import { capitalizeFirstLetter } from '@/components/Utils/CapitalizeFirstLetter';
import { NumericFormat } from 'react-number-format';

interface Props {
  value: ProductToppingsGroupDto[];
  onChange: (updatedGroups: ProductToppingsGroupDto[]) => void;
  units: IUnitOfMeasureForm[];
}

interface ToppingsGroup {
  id: string;
  name: string;
  isActive: boolean;
}

export const AvailableToppingsGroups = ({ value, onChange, units }: Props) => {
  const { getAccessToken } = useAuth();
  const [availableGroups, setAvailableGroups] = useState<ToppingsGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<ToppingsGroup[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const token = getAccessToken();
      if (!token) return;
      const data = await ToppingsGroupWithoutToppings(token);
      setAvailableGroups(data);
    };
    fetchGroups();
  }, [getAccessToken]);

  const handleGroupSelection = (_: any, selected: ToppingsGroup[]) => {
    setSelectedGroups(selected);

    const mapped: ProductToppingsGroupDto[] = selected.map((group) => {
      const existing = value.find((v) => v.toppingsGroupId === group.id);
      return (
        existing || {
          toppingsGroupId: group.id,
          quantityOfTopping: 1,
          unitOfMeasureId: undefined,
          settings: {
            maxSelection: 1,
            chargeExtra: false,
            extraCost: 0,
          },
        }
      );
    });

    onChange(mapped);
  };

  const handleFieldChange = (
    groupId: string,
    field: keyof ProductToppingsGroupDto | "maxSelection" | "chargeExtra" | "extraCost",
    fieldValue: any
  ) => {
    const updated = value.map((group) => {
      if (group.toppingsGroupId !== groupId) return group;

      if (field === "maxSelection" || field === "chargeExtra" || field === "extraCost") {
        return {
          ...group,
          settings: {
            ...group.settings,
            [field]: fieldValue,
          },
        };
      }

      return {
        ...group,
        [field]: fieldValue,
      };
    });

    onChange(updated);
  };

  return (
    <>
      <Autocomplete
        multiple
        options={availableGroups}
        getOptionLabel={(option) => capitalizeFirstLetter(option.name)}
        value={availableGroups.filter((g) => value.some((v) => v.toppingsGroupId === g.id))}
        onChange={handleGroupSelection}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              label={capitalizeFirstLetter(option.name)}
              {...getTagProps({ index })}
              key={option.id}
              sx={{
                backgroundColor: "#f3d49ab8",
                color: "black",
                fontWeight: "bold",
              }}
            />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Grupos de agregados"
            placeholder="Seleccionar grupos"
            size="small"
          />
        )}
      />

      {value.map((group) => {
        const groupData = availableGroups.find((g) => g.id === group.toppingsGroupId);
        const groupName = groupData?.name || "Grupo";

        return (
          <Grid container spacing={1} mt={1} key={group.toppingsGroupId}>
            <Grid item xs={12}>
              <p>
                Grupo:{" "}
                <strong style={{ color: "green" }}>
                  {capitalizeFirstLetter(groupName)}
                </strong>
              </p>
            </Grid>

            <Grid item xs={6}>
              <Tooltip title="Cantidad que se le agrega al producto por agregado. Ej: 100gr">
                <Box>
                  <NumericFormat
                    customInput={TextField}
                    label="Cantidad"
                    value={group.quantityOfTopping}
                    thousandSeparator='.'
                    decimalSeparator=','
                    decimalScale={2}
                    allowNegative={false}
                    type='text'
                    fullWidth
                    size='small'
                    onValueChange={(values) => {
                      handleFieldChange(group.toppingsGroupId, "quantityOfTopping", values.floatValue ?? null);
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={6}>
              <TextField
                select
                label="Unidad"
                size="small"
                fullWidth
                value={group.unitOfMeasureId || ""}
                onChange={(e) =>
                  handleFieldChange(group.toppingsGroupId, "unitOfMeasureId", e.target.value)
                }
              >
                {units.map((unit) => (
                  <MenuItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <Tooltip title="Cantidad de agregados que se pueden seleccionar. Ej: 3">
                <Box>
                  <NumericFormat
                    customInput={TextField}
                    label="Máx. selección"
                    value={group.settings?.maxSelection ?? 1}
                    thousandSeparator='.'
                    decimalSeparator=','
                    decimalScale={0}
                    allowNegative={false}
                    type='text'
                    fullWidth
                    size='small'
                    onValueChange={(values) => {
                      handleFieldChange(group.toppingsGroupId, "maxSelection", values.floatValue ?? null);
                    }}
                  />
                </Box>
              </Tooltip>
            </Grid>

            <Grid item xs={6} display="flex" alignItems="center">
              <Tooltip title="Si se activa, se le cobrará un extra al cliente.">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={group.settings?.chargeExtra ?? false}
                      onChange={(e) =>
                        handleFieldChange(group.toppingsGroupId, "chargeExtra", e.target.checked)
                      }
                    />
                  }
                  label="Cobrar extra"
                />
              </Tooltip>
            </Grid>

            {/* Mostrar monto extra si es el grupo con ID "extracash" y está activado el cobro extra */}
            {group.settings?.chargeExtra && (
              <Grid item xs={12}>

                <NumericFormat
                  customInput={TextField}
                  label="Monto extra a cobrar"
                  value={group.settings?.extraCost ?? 0}
                  thousandSeparator='.'
                  decimalSeparator=','
                  decimalScale={2}
                  allowNegative={false}
                  type='text'
                  fullWidth
                  size='small'
                  onValueChange={(values) => {
                    handleFieldChange(
                      group.toppingsGroupId,
                      "extraCost",
                      values.floatValue ?? 0
                    );
                  }}
                />
              </Grid>
            )}

          </Grid>
        );
      })}
    </>
  );
};
