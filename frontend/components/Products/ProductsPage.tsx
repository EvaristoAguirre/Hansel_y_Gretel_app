"use client";
import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TabsNavigation } from "./TabsNavigations";
import { fetchCategories } from "@/api/categories";
import { useProductos } from "@/components/Hooks/useProducts";
import { useCategoryStore } from "@/components/Categories/useCategoryStore";
import CategoriasProductos from "@/components/Categories/ProductsCategory/ProductsCategory";
import Products from "./TabProducts/Products";
import StockControl from "./TabControlStock/ControlStock";
import { Tab } from "../Enums/view-products";
import Ingredients from "./TabIngredients/Ingredients";
import UnitOfMeasure from "./TabUnitOfMeasure/UnitOfMeasure";
import IngredientsProvider from "@/app/context/ingredientsContext";
import UnitProvider from "@/app/context/unitOfMeasureContext";
import { useAuth } from "@/app/context/authContext";


const ProductsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [tabs, setTabs] = useState([
    Tab.PRODUCTOS,
    Tab.INGREDIENTES,
    Tab.CATEGORIA_PRODUCTOS,
    Tab.UNIDADES_MEDIDA,
    Tab.CONTROL_DE_STOCK,
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

  const { connectWebSocket } = useProductos();

  const { categories, setCategories, } = useCategoryStore();
  const { getAccessToken } = useAuth();


  // Obtener categorías al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = await fetchCategories(token);
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

  const clearSelectedCategory = () => {
    setSelectedCategoryId(null);
  };


  return (
    <Box display="flex" flexDirection="column" min-height="100vh" bgcolor={"white"}>
      <TabsNavigation tabIndex={tabIndex} onTabChange={handleTabChange} tabs={tabs} />
      <Box display="flex" flex={1} overflow="hidden">
        {
          (selectedTab === Tab.PRODUCTOS ||
            selectedTab === Tab.CATEGORIA_PRODUCTOS) &&
          <Sidebar
            onCategorySelected={handleCategorySelected}
            selectedCategoryId={selectedCategoryId}
          />
        }
        {selectedTab === Tab.PRODUCTOS &&
          <Products
            selectedCategoryId={selectedCategoryId}
            onClearSelectedCategory={clearSelectedCategory}
          />
        }
        {selectedTab === Tab.CATEGORIA_PRODUCTOS && <CategoriasProductos />}
        {selectedTab === Tab.CONTROL_DE_STOCK && (
          <Box flex={1} overflow="auto">
            <StockControl
              selectedCategoryId={selectedCategoryId}
              onClearSelectedCategory={clearSelectedCategory}
            />
          </Box>
        )}
        {selectedTab === Tab.UNIDADES_MEDIDA &&
          <UnitProvider>
            <UnitOfMeasure />
          </UnitProvider>
        }
        {selectedTab === Tab.INGREDIENTES &&
          <IngredientsProvider>
            <Ingredients />
          </IngredientsProvider>
        }
      </Box>
    </Box>
  );
};

export default ProductsPage;