import { UserRole } from '@/components/Enums/user';
import LoadingLottie from '@/components/Loader/Loading';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import { Suspense } from 'react';
import Cafe from '../../../components/Cafe/Cafe';
const ViewCafe = () => {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserRole.ADMIN,
        UserRole.ENCARGADO,
        UserRole.MOZO,
        UserRole.INVENTARIO,
      ]}
    >
      <Cafe />
    </ProtectedRoute>
  );
};

export default ViewCafe;
