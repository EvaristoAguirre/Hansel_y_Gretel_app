'use client';
import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TabsNavigation } from './TabsNavigations';
import { Tab } from '../Enums/view-products';
import IngredientsProvider from '@/app/context/ingredientsContext';
import UnitProvider from '@/app/context/unitOfMeasureContext';
import { useAuth } from '@/app/context/authContext';
import ProductsContent from './ProductContent';
import { useCategoryStore } from '../Categories/useCategoryStore';
import { fetchCategories } from '@/api/categories';
import { UserRole } from '../Enums/user';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const { getAccessToken, userRoleFromToken } = useAuth();
  const { setCategories } = useCategoryStore();

  // Configurar pestañas según el rol del usuario
  useEffect(() => {
    const userRole = userRoleFromToken();
    if (userRole === UserRole.INVENTARIO) {
      // Para INVENTARIO, solo mostrar Control de Stock
      setTabs([Tab.CONTROL_DE_STOCK]);
      setSelectedTab(Tab.CONTROL_DE_STOCK);
      setTabIndex(0);
    } else {
      // Para otros roles, mostrar todas las pestañas
      setTabs([
        Tab.PRODUCTOS,
        Tab.INGREDIENTES,
        Tab.CATEGORIA_PRODUCTOS,
        Tab.UNIDADES_MEDIDA,
        Tab.CONTROL_DE_STOCK,
      ]);
      setSelectedTab(Tab.PRODUCTOS);
      setTabIndex(0);
    }
  }, [userRoleFromToken]);

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
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      bgcolor={'white'}
    >
      <TabsNavigation
        tabIndex={tabIndex}
        tabs={tabs}
        onChange={handleTabChange}
      />
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
