import React, { useState } from "react";
import { Drawer, List, ListItem, ListItemText, ListItemButton } from "@mui/material";
import { useCategoryStore } from "@/components/Categorías/useCategoryStore";
import { ICategory } from "@/components/Interfaces/ICategories";
export const Sidebar: React.FC<{
  onCategorySelected: (categoryId: string) => void;
  selectedCategoryId: string | null; // Nueva prop
}> = ({ onCategorySelected, selectedCategoryId }) => {
  const { categories } = useCategoryStore();

  const handleCategoryClick = (category: ICategory) => {
    onCategorySelected(category.id);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: "20%",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: "100%",
          backgroundColor: "var(--color-primary)",
          boxSizing: "border-box",
          position: "relative",
          minHeight: "100vh",
          top: 0,
        },
      }}
    >
      <List>
        {categories && categories.length > 0 ? (
          categories.map((category: ICategory) => {
            const isSelected = selectedCategoryId === category.id; // Comparar con la categoría seleccionada
            return (
              <ListItem key={category.id} disablePadding>
                <ListItemButton
                  aria-label={`Seleccionar categoría ${category.name}`}
                  onClick={() => handleCategoryClick(category)}
                  sx={{
                    backgroundColor: isSelected ? "#f3d49ab8" : "transparent",
                    "& .MuiTypography-root": {
                      color: isSelected ? "black" : "white",
                    },
                  }}
                >
                  <ListItemText primary={category.name} />
                </ListItemButton>
              </ListItem>
            );
          })
        ) : (
          <ListItem>
            <ListItemText primary="No hay categorías disponibles" sx={{ color: "white" }} />
          </ListItem>
        )}
      </List>
    </Drawer>
  );
};

