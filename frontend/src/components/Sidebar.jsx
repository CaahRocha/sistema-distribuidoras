import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export function Sidebar() {
  const { usuario, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Logo / Título */}
      <div className="sidebar-header">
        <img src="/logo.svg" alt="Logo" style={{ width: '44px', height: '44px', flexShrink: 0 }} />
        <div>
          <h1 className="sidebar-title">Distribuidora</h1>
          <p className="sidebar-subtitle">Sistema de Gestão</p>
        </div>
      </div>

      {/* Informações do usuário */}
      <div className="sidebar-user">
        <div className="user-avatar">{usuario?.nome?.charAt(0).toUpperCase()}</div>
        <div className="user-info">
          <p className="user-name">{usuario?.nome}</p>
          <span className={`user-badge ${usuario?.perfil}`}>
            {usuario?.perfil === 'admin' ? 'Administrador' : 'Caixa'}
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          <span>Início</span>
        </NavLink>

        <NavLink to="/pedidos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">🛒</span>
          <span>Pedidos</span>
        </NavLink>

        <NavLink to="/clientes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          <span>Clientes</span>
        </NavLink>

        <NavLink to="/financeiro" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">💰</span>
          <span>Financeiro</span>
        </NavLink>

        {/* Separador - só admin vê o restante */}
        {isAdmin() && (
          <>
            <div className="nav-divider">
              <span>Administração</span>
            </div>

            <NavLink to="/produtos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📦</span>
              <span>Produtos</span>
            </NavLink>

            <NavLink to="/estoque" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🏬</span>
              <span>Estoque</span>
            </NavLink>

            <NavLink to="/relatorios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📈</span>
              <span>Relatórios</span>
            </NavLink>

            <NavLink to="/usuarios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">⚙️</span>
              <span>Usuários</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Botão de logout */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
