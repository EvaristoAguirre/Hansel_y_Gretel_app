import { Box } from '@mui/system';
import { useEffect } from 'react';
import { Tab } from '../Enums/view-products';
import { useProducts } from '../Hooks/useProducts';
import { Sidebar } from './Sidebar';
import StockControl from './TabControlStock/StockControl';
import Ingredients from './TabIngredients/Ingredients';
import Products from './TabProducts/Products';
import CategoriesTable from './TabProductsCategory/CategoriesTable';
import UnitOfMeasure from './TabUnitOfMeasure/UnitOfMeasure';
import { useAuth } from '@/app/context/authContext';
import { UserRole } from '../Enums/user';

interface ProductsContentProps {
  selectedTab: Tab;
  selectedCategoryId: string | null;
  onCategorySelected: (categoryId: string | null) => void;
  onClearSelectedCategory: () => void;
  getAccessToken: () => string | null;
}

const ProductsContent: React.FC<ProductsContentProps> = ({
  selectedTab,
  selectedCategoryId,
  onCategorySelected,
  onClearSelectedCategory,
  getAccessToken,
}) => {
  const { connectWebSocket } = useProducts();
  const { userRoleFromToken } = useAuth();

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  const userRole = userRoleFromToken();

  return (
    <>
      {selectedTab === Tab.PRODUCTOS && userRole !== UserRole.INVENTARIO && (
        <>
          <Sidebar
            onCategorySelected={onCategorySelected}
            selectedCategoryId={selectedCategoryId}
          />
          <Products
            selectedCategoryId={selectedCategoryId}
            onClearSelectedCategory={onClearSelectedCategory}
          />
        </>
      )}
      {selectedTab === Tab.CATEGORIA_PRODUCTOS &&
        userRole !== UserRole.INVENTARIO && <CategoriesTable />}
      {selectedTab === Tab.CONTROL_DE_STOCK && (
        <Box flex={1} overflow="auto">
          <StockControl />
        </Box>
      )}
      {selectedTab === Tab.UNIDADES_MEDIDA &&
        userRole !== UserRole.INVENTARIO && <UnitOfMeasure />}
      {selectedTab === Tab.INGREDIENTES && userRole !== UserRole.INVENTARIO && (
        <Ingredients />
      )}
    </>
  );
};
export default ProductsContent;
