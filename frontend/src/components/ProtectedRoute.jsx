import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege rotas que exigem login
export function ProtectedRoute({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="loading-screen">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Protege rotas que exigem perfil admin
export function AdminRoute({ children }) {
  const { usuario, carregando, isAdmin } = useAuth();

  if (carregando) {
    return <div className="loading-screen">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
