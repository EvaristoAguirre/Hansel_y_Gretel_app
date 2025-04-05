import { Box } from "@mui/system";
import { useEffect } from "react";
import { useCategoryStore } from "../Categories/useCategoryStore";
import { Tab } from "../Enums/view-products";
import { useProductos } from "../Hooks/useProducts";
import { Sidebar } from "./Sidebar";
import StockControl from "./TabControlStock/StockControl";
import Ingredients from "./TabIngredients/Ingredients";
import Products from "./TabProducts/Products";
import ProductsCategory from "./TabProductsCategory/ProductsCategory";
import UnitOfMeasure from "./TabUnitOfMeasure/UnitOfMeasure";

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
  const { connectWebSocket } = useProductos();
  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  return (
    <>
      {selectedTab === Tab.PRODUCTOS && (
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
      {selectedTab === Tab.CATEGORIA_PRODUCTOS && <ProductsCategory />}
      {selectedTab === Tab.CONTROL_DE_STOCK && (
        <Box flex={1} overflow="auto">
          <StockControl />
        </Box>
      )}
      {selectedTab === Tab.UNIDADES_MEDIDA && (
        <UnitOfMeasure />
      )}
      {selectedTab === Tab.INGREDIENTES && (
        <Ingredients />
      )}
    </>
  );
};
export default ProductsContent;