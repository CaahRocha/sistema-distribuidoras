import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import LicencaExpirada from './pages/LicencaExpirada';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import NovoPedido from './pages/NovoPedido';
import Estoque from './pages/Estoque';
import Financeiro from './pages/Financeiro';
import Relatorios from './pages/Relatorios';
import Usuarios from './pages/Usuarios';
import Configuracoes from './pages/Configuracoes';

import './App.css';

function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [licencaExpirada, setLicencaExpirada] = useState(false);

  // Escuta o evento global de licença expirada
  useEffect(() => {
    const handler = () => setLicencaExpirada(true);
    window.addEventListener('licenca-expirada', handler);
    return () => window.removeEventListener('licenca-expirada', handler);
  }, []);

  // Tela de bloqueio — aparece por cima de tudo
  if (licencaExpirada) return <LicencaExpirada />;

  return (
    <AuthProvider>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/pedidos" element={
          <ProtectedRoute>
            <Layout><Pedidos /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/pedidos/novo" element={
          <ProtectedRoute>
            <Layout><NovoPedido /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/pedidos/:id" element={
          <ProtectedRoute>
            <Layout><NovoPedido /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/clientes" element={
          <ProtectedRoute>
            <Layout><Clientes /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/financeiro" element={
          <ProtectedRoute>
            <Layout><Financeiro /></Layout>
          </ProtectedRoute>
        } />

        {/* Rotas admin */}
        <Route path="/produtos" element={
          <AdminRoute>
            <Layout><Produtos /></Layout>
          </AdminRoute>
        } />

        <Route path="/estoque" element={
          <AdminRoute>
            <Layout><Estoque /></Layout>
          </AdminRoute>
        } />

        <Route path="/relatorios" element={
          <AdminRoute>
            <Layout><Relatorios /></Layout>
          </AdminRoute>
        } />

        <Route path="/usuarios" element={
          <AdminRoute>
            <Layout><Usuarios /></Layout>
          </AdminRoute>
        } />

        <Route path="/configuracoes" element={
          <AdminRoute>
            <Layout><Configuracoes /></Layout>
          </AdminRoute>
        } />

        {/* Redirecionar rotas inválidas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
