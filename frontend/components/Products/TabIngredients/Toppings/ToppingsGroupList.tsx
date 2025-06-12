import { createToppingGroup, deleteToppingGroup, editToppingGroup, fetchAllToppingsGroup, fetchToppings } from "@/api/topping";
import { useAuth } from "@/app/context/authContext";
import { ITopping, IToppingsGroup } from "@/components/Interfaces/IToppings";
import LoadingLottie from "@/components/Loader/Loading";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CardActions,
  Chip,
  Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import FormToppingsGroup from "./FormToppingsGroup";
import { Stack } from "@mui/system";
import Swal from "sweetalert2";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import { AutoAwesome } from "@mui/icons-material";

const ToppingsGroupList = () => {
  const [toppingsGroups, setToppingsGroups] = useState<IToppingsGroup[]>([]);
  const [toppings, setToppings] = useState<ITopping[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<IToppingsGroup | null>(null);
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const loadData = async () => {
    setLoading(true);
    const [groups, toppings] = await Promise.all([
      token && fetchAllToppingsGroup(token),
      token && fetchToppings(token),
    ]);
    setToppingsGroups(groups);
    setToppings(toppings);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setGroupToEdit(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (group: IToppingsGroup) => {
    setGroupToEdit(group);
    setFormOpen(true);
  };

  const handleSave = async (groupData: {
    name: string;
    toppingsIds: string[];
  }) => {
    let response: any;

    if (groupToEdit) {
      response = token && await editToppingGroup(token, groupData, groupToEdit.id);

      if (response?.ok) {
        Swal.fire("Éxito", "Grupo actualizado correctamente.", "success");
      } else {
        Swal.fire("Error", response?.data?.message || "No se pudo actualizar el grupo.", "error");
      }
    } else {
      response = token && await createToppingGroup(token, groupData);
      if (response?.ok) {
        Swal.fire("Éxito", "Grupo creado correctamente.", "success");
      } else {
        Swal.fire("Error", response?.data?.message || "No se pudo crear el grupo.", "error");
      }
    }

    setFormOpen(false);
    await loadData();
  };

  const handleDeleteGroup = async (id: string) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro/a?",
      text: "Esta acción eliminará el grupo de agregados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      let response: any;

      response = token && await deleteToppingGroup(token, id);

      if (response?.ok) {
        Swal.fire("Éxito", "Grupo eliminado correctamente.", "success");
        await loadData();
      } else {
        Swal.fire("Error", response?.data?.message || "No se pudo eliminar el grupo.", "error");
      }
    }
  };

  return (
    <Box sx={{ m: 4 }}>
      <Button variant="contained" onClick={handleOpenCreate} sx={{ mb: 3 }}>
        + Nuevo Grupo
      </Button>

      {loading ? (
        <LoadingLottie />
      ) : (
        <Grid container spacing={2}>
          {toppingsGroups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{group.name.toLocaleUpperCase()}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }} component="div">
                    {
                      group.toppings.length === 0
                        ? 'Sin "agregados" asignados'
                        : <Stack direction="row" flexWrap="wrap" gap={1}>
                          {group.toppings.map((topping) => (
                            <Chip
                              key={topping.id}
                              label={capitalizeFirstLetter(topping.name)}
                              icon={<AutoAwesome />}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                    }
                  </Typography>

                </CardContent>
                <CardActions sx={{ justifyContent: "space-around" }}>
                  <Tooltip
                    title="Eliminar"
                    enterDelay={150}
                  >
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      sx={{
                        color: "gray",
                        "&:hover": {
                          color: "red",
                        },
                      }}
                      onClick={() => handleDeleteGroup(group.id)}>
                    </Button>
                  </Tooltip>
                  <Tooltip title="Editar" enterDelay={150}>

                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      sx={{
                        "&:hover": {
                          fontWeight: "bold",
                          color: "secondary.main",
                        },
                      }}
                      onClick={() => handleOpenEdit(group)}>
                    </Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <FormToppingsGroup
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        toppings={toppings}
        initialData={groupToEdit}
        isLoading={false}
      />
    </Box>
  );
};

export default ToppingsGroupList;
