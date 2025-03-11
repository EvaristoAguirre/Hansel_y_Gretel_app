import LoadingLottie from '@/components/Loader/Loading';
import { Suspense } from 'react';
import Cafe from '../../../components/Cafe/Cafe';
const ViewCafe = () => {

  return (
    <Suspense fallback={<LoadingLottie />}>
      <Cafe />
    </Suspense>
  );
}

export default ViewCafe