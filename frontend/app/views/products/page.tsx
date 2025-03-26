import ProductsPage from "@/components/Products/ProductsPage";
import { Suspense } from "react";
import LoadingLottie from '../../../components/Loader/Loading';
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
import { UserRole } from "@/components/Enums/user";
const ViewProducts = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ENCARGADO]}>
      <Suspense fallback={<LoadingLottie />}>
        <ProductsPage />
      </Suspense>
    </ProtectedRoute>
  );
};
export default ViewProducts;