"use client";
import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useProductos } from "../Hooks/useProducts";
import Productos from "./Producto";
import { Sidebar } from "./Sidebar";
import { TabsNavigation } from "./tabsNavigations";
import CategoriasProductos from '../Categorías/CategoríasProductos/CategoriasProductos';
import CategoriasIngredientes from '../Categorías/CategoríasIngredientes/CategoriasIngredientes';
import { useCategoryStore } from "../Categorías/useCategoryStore";
import { fetchCategories } from "@/helpers/categories";

const ProductsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tabs, setTabs] = useState([
    "Productos",
    "Ingredientes",
    "Categoría productos",
    "Categoría ingredientes",
    "Control de Stock",
  ]);
  const [selectedTab, setSelectedTab] = useState(tabs[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue !== 0) {
      const selectedTab = tabs[newValue];
      setSelectedTab(selectedTab);
      const newTabsOrder = [
        selectedTab,
        ...tabs.filter((_, index) => index !== newValue),
      ];
      setTabs(newTabsOrder);
      setTabIndex(0); // El tab seleccionado siempre estará en el índice 0 tras el reordenamiento
    }
  };

  const {  connectWebSocket } = useProductos();

  const {categories, setCategories, }  = useCategoryStore();

    // Obtener categorías al cargar el componente
    useEffect(() => {
      const fetchData = async () => {
        try {
          const data  = await fetchCategories();
          setCategories(data);
          connectWebSocket();
        } catch (error) {
          console.error(error);
        }
      };
      fetchData();
    }, [setCategories, connectWebSocket]);

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const handleCategorySelected = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <TabsNavigation tabIndex={tabIndex} onTabChange={handleTabChange} tabs={tabs} /> 
      <Box display="flex" flex={1} overflow="hidden">
        <Sidebar onCategorySelected={handleCategorySelected} />
        {selectedTab === "Productos" && <Productos selectedCategoryId={selectedCategoryId}/>}
        {selectedTab === "Ingredientes" && <CategoriasIngredientes />}
        {selectedTab === "Categoría productos" && <CategoriasProductos />}
      </Box>
    </Box>
  );
};

export default ProductsPage;