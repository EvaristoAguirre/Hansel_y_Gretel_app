import ProductsPage from "@/components/Products/ProductsPage";
import { Suspense } from "react";
import LoadingLottie from '../../../components/Loader/Loading';
import ProtectedRoute from "@/components/ProtectedRoute/ProtectedRoute";
const ViewProducts = () => {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingLottie />}>
        <ProductsPage />
      </Suspense>
    </ProtectedRoute>
  );
};
export default ViewProducts;