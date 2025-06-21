import React from 'react'
import { UserRole } from '@/components/Enums/user';
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import DailyCash from '@/components/DailyCash/PanelDailyCash';
import { DailyCashProvider } from '@/app/context/dailyCashContext';

const ViewDailyCash = () => {
  return (
    <DailyCashProvider>
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ENCARGADO]}>
        <DailyCash />
      </ProtectedRoute>
    </DailyCashProvider>
  )
}

export default ViewDailyCash