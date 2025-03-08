import IngredientsProvider from "@/app/context/ingredientsContext";
import UnitProvider from "@/app/context/unitOfMeasureContext";
import ProductsPage from "@/components/Products/ProductsPage";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";

const ViewProducts = () => {
  return (
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  );
};
export default ViewProducts;