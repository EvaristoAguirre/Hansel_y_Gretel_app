import React, { useState } from "react";
import { Drawer, List, ListItem, ListItemText, ListItemButton } from "@mui/material";
// import { useCategoryStore } from "@/components/Products/TabProductsCategory/useCategoryStore";
import { useCategoryStore } from "../Categories/useCategoryStore";
import { ICategory } from "@/components/Interfaces/ICategories";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";
export const Sidebar: React.FC<{
  onCategorySelected: (categoryId: string | null) => void;
  selectedCategoryId: string | null;

}> = ({ onCategorySelected, selectedCategoryId }) => {

  const { categories, setCategories } = useCategoryStore();

  const handleCategoryClick = (category: ICategory | null) => {
    onCategorySelected(category?.id ?? null)
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
          position: "static",
          minHeight: "100vh",
          top: 0,
        },
      }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton
            aria-label="Mostrar todos los productos"
            onClick={() => handleCategoryClick(null)}
            sx={{
              backgroundColor: selectedCategoryId === null ? "#f3d49ab8" : "transparent",
              "& .MuiTypography-root": {
                color: selectedCategoryId === null ? "black" : "white",
              },
            }}
          >
            <ListItemText primary="Todos los productos" />
          </ListItemButton>
        </ListItem>
        {categories && categories.length > 0 ? (
          categories.map((category: ICategory) => {
            const isSelected = selectedCategoryId === category.id;
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
                  <ListItemText primary={capitalizeFirstLetter(category.name)} />
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

