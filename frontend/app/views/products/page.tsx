import ProductsPage from "@/components/Products/ProductsPage";
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import { UserRole } from "@/components/Enums/user";
const ViewProducts = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ENCARGADO]}>
      <ProductsPage />
    </ProtectedRoute>
  );
};
export default ViewProducts;