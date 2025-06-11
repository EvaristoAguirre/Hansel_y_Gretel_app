import React from 'react'
import { UserRole } from '@/components/Enums/user';
import LoadingLottie from '@/components/Loader/Loading';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import DailyCash from '@/components/DailyCash/DailyCash';

const ViewDailyCash = () => {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ENCARGADO]}>
      <DailyCash />
    </ProtectedRoute>
  )
}

export default ViewDailyCash