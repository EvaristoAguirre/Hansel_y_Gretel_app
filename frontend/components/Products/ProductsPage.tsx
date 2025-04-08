"use client";
import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { TabsNavigation } from "./TabsNavigations";
import { Tab } from "../Enums/view-products";
import IngredientsProvider from "@/app/context/ingredientsContext";
import UnitProvider from "@/app/context/unitOfMeasureContext";
import { useAuth } from "@/app/context/authContext";
import ProductsContent from "./ProductContent";
import { useCategoryStore } from "../Categories/useCategoryStore";
import { fetchCategories } from "@/api/categories";


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

  const { getAccessToken } = useAuth();
  const { setCategories } = useCategoryStore();

  useEffect(() => {
    const fetchData = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = await fetchCategories(token);
        if (data) setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [getAccessToken, setCategories]);

  const handleTabChange = (event: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
    setSelectedTab(tabs[newIndex]);
  };

  const handleCategorySelected = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const clearSelectedCategory = () => {
    setSelectedCategoryId(null);
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor={"white"}>
      <TabsNavigation tabIndex={tabIndex} tabs={tabs} onChange={handleTabChange} />
      <Box display="flex" flex={1} overflow="hidden">
        <UnitProvider>
          <IngredientsProvider>
            <ProductsContent
              selectedTab={selectedTab}
              selectedCategoryId={selectedCategoryId}
              onCategorySelected={handleCategorySelected}
              onClearSelectedCategory={clearSelectedCategory}
              getAccessToken={getAccessToken}
            />
          </IngredientsProvider>
        </UnitProvider>
      </Box>
    </Box>
  );
};


export default ProductsPage;