import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { relatoriosService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const data = await relatoriosService.dashboard();
      setDados(data);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) {
    return <div className="loading-screen">Carregando...</div>;
  }

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">{saudacao}, {usuario?.nome?.split(' ')[0]}! 👋</h2>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pedidos/novo')}>
          + Novo Pedido
        </button>
      </div>

      <div className="page-content">
        {/* Cards do dia */}
        <div className="cards-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-card-icon">🛒</div>
            <div className="stat-card-value">{dados?.vendas_hoje?.pedidos || 0}</div>
            <div className="stat-card-label">Pedidos Hoje</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">💵</div>
            <div className="stat-card-value">{formatarMoeda(dados?.vendas_hoje?.total)}</div>
            <div className="stat-card-label">Vendas Hoje</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon">📅</div>
            <div className="stat-card-value">{formatarMoeda(dados?.vendas_mes?.total)}</div>
            <div className="stat-card-label">Vendas do Mês</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
            <div className="stat-card-icon">💰</div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>
              {formatarMoeda(dados?.caixa_hoje?.saldo)}
            </div>
            <div className="stat-card-label">Saldo do Caixa Hoje</div>
          </div>

          <div className="stat-card" style={{ borderLeft: dados?.alertas_estoque > 0 ? '3px solid var(--warning)' : 'none' }}>
            <div className="stat-card-icon">📦</div>
            <div className="stat-card-value" style={{ color: dados?.alertas_estoque > 0 ? 'var(--warning)' : 'inherit' }}>
              {dados?.alertas_estoque || 0}
            </div>
            <div className="stat-card-label">Alertas de Estoque</div>
          </div>

          <div className="stat-card" style={{ borderLeft: dados?.total_fiado > 0 ? '3px solid var(--danger)' : 'none' }}>
            <div className="stat-card-icon">📋</div>
            <div className="stat-card-value" style={{ color: dados?.total_fiado > 0 ? 'var(--danger)' : 'inherit' }}>
              {formatarMoeda(dados?.total_fiado)}
            </div>
            <div className="stat-card-label">Total em Fiado</div>
          </div>
        </div>

        {/* Detalhes do caixa */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">💵 Caixa de Hoje</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/financeiro')}>Ver mais</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--success-light)', borderRadius: 'var(--radius)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>↑ Entradas</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatarMoeda(dados?.caixa_hoje?.entradas)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--danger-light)', borderRadius: 'var(--radius)' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>↓ Saídas</span>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{formatarMoeda(dados?.caixa_hoje?.saidas)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 10px', borderTop: '2px solid var(--border)' }}>
                <span style={{ fontWeight: 700 }}>= Saldo</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: dados?.caixa_hoje?.saldo >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatarMoeda(dados?.caixa_hoje?.saldo)}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">🛒 Pedidos em Aberto</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pedidos')}>Ver todos</button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '52px', fontWeight: 700, color: dados?.pedidos_abertos > 0 ? 'var(--primary)' : 'var(--text-light)' }}>
                {dados?.pedidos_abertos || 0}
              </div>
              <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>pedido(s) aguardando fechamento</p>
              {dados?.pedidos_abertos > 0 && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => navigate('/pedidos')}>
                  Gerenciar pedidos
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Alertas de estoque */}
        {dados?.alertas_estoque > 0 && (
          <div className="alert alert-warning" style={{ marginTop: '16px' }}>
            ⚠️ <strong>{dados.alertas_estoque} produto(s)</strong> com estoque abaixo do mínimo.
            <button
              className="btn btn-warning btn-sm"
              style={{ marginLeft: '12px' }}
              onClick={() => navigate('/estoque')}
            >
              Ver estoque
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
