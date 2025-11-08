import ProductsPage from '@/components/Products/ProductsPage';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import { UserRole } from '@/components/Enums/user';
const ViewProducts = () => {
  return (
    <ProtectedRoute
      allowedRoles={[UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO]}
    >
      <ProductsPage />
    </ProtectedRoute>
  );
};
export default ViewProducts;
