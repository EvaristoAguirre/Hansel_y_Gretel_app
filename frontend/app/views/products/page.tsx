import ProductsPage from "@/components/Products/ProductsPage";
import { Suspense } from "react";
import LoadingLottie from '../../../components/Loader/Loading';
const ViewProducts = () => {
  return (
    <Suspense fallback={<LoadingLottie />}>
      <ProductsPage />
    </Suspense>
  );
};
export default ViewProducts;