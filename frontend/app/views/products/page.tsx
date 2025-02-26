import IngredientsProvider from "@/app/context/ingredientsContext";
import ProductsPage from "@/components/Products/ProductsPage";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

const ViewProducts = () => {
  return (
    <ProtectedRoute>
      <IngredientsProvider>
        <ProductsPage />
      </IngredientsProvider>
    </ProtectedRoute>
  );
};
export default ViewProducts;