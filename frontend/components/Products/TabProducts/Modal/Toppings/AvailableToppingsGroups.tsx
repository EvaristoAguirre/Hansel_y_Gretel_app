import { Autocomplete, TextField, Grid, Checkbox, FormControlLabel, MenuItem, Tooltip, Chip } from '@mui/material';
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/authContext";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { ToppingsGroupWithoutToppings } from "@/api/topping";
import { ProductToppingsGroupDto } from "@/components/Interfaces/IProducts";
import { capitalizeFirstLetter } from '@/components/Utils/CapitalizeFirstLetter';

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
      return existing || {
        toppingsGroupId: group.id,
        quantityOfTopping: 1,
        unitOfMeasureId: undefined,
        settings: {
          maxSelection: 1,
          chargeExtra: false,
        },
      };
    });

    onChange(mapped);
  };

  const handleFieldChange = (
    groupId: string,
    field: keyof ProductToppingsGroupDto | "maxSelection" | "chargeExtra",
    fieldValue: any
  ) => {
    const updated = value.map((group) => {
      if (group.toppingsGroupId !== groupId) return group;
      if (field === "maxSelection" || field === "chargeExtra") {
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
              sx={{ backgroundColor: "#f3d49ab8", color: "black", fontWeight: "bold" }}
            />

          ))
        }
        renderInput={(params) => (
          <TextField {...params} label="Grupos de agregados" placeholder="Seleccionar grupos" size="small" />
        )}
      />


      {value.map((group) => {
        const groupName = availableGroups.find((g) => g.id === group.toppingsGroupId)?.name || "Grupo";

        return (
          <Grid container spacing={1} mt={1} key={group.toppingsGroupId}>
            <Grid item xs={12}>
              <p>Grupo: <strong style={{ color: "green" }}> {capitalizeFirstLetter(groupName)}</strong></p>
            </Grid>
            <Grid item xs={6}>
              <Tooltip title="Cantidad que se le agrega al producto por agregado. Ej: 100gr">
                <TextField
                  label="Cantidad"
                  type="number"
                  size="small"
                  fullWidth
                  value={group.quantityOfTopping}
                  onChange={(e) =>
                    handleFieldChange(group.toppingsGroupId, "quantityOfTopping", Number(e.target.value))
                  }
                />
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

                <TextField
                  label="Máx. selección"
                  type="number"
                  size="small"
                  fullWidth
                  value={group.settings?.maxSelection ?? 1}
                  onChange={(e) =>
                    handleFieldChange(group.toppingsGroupId, "maxSelection", Number(e.target.value))
                  }
                />
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
                  style={{ fontSize: "0.8rem", color: `${group.settings?.chargeExtra ? "green" : "gray"}`, fontWeight: "bold" }}
                />
              </Tooltip>
            </Grid>
          </Grid>
        );
      })}
    </>
  );
};
