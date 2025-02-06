import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';
import Cafe from '../../../components/Cafe/Cafe';
const ViewCafe = () => {

  return (
    <ProtectedRoute>

      <Cafe />

    </ProtectedRoute>
  );
}

export default ViewCafe