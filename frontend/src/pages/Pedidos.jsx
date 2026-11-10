import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pedidosService } from '../services/api';

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const formatarData = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const PAGAMENTOS = {
  dinheiro: { label: 'Dinheiro', badge: 'badge-success' },
  pix: { label: 'PIX', badge: 'badge-info' },
  cartao: { label: 'Cartão', badge: 'badge-gray' },
  fiado: { label: 'Fiado', badge: 'badge-danger' }
};

const STATUS = {
  aberto: { label: 'Aberto', badge: 'badge-warning' },
  fechado: { label: 'Fechado', badge: 'badge-success' },
  cancelado: { label: 'Cancelado', badge: 'badge-gray' }
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    carregarPedidos();
  }, [statusFiltro, dataInicio, dataFim]);

  const carregarPedidos = async () => {
    setCarregando(true);
    try {
      const params = {};
      if (statusFiltro) params.status = statusFiltro;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      const data = await pedidosService.listar(params);
      setPedidos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const handleCancelar = async (pedido) => {
    if (!confirm(`Cancelar o pedido #${pedido.id}?`)) return;
    try {
      await pedidosService.cancelar(pedido.id);
      carregarPedidos();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Pedidos</h2>
          <p className="page-subtitle">{pedidos.length} pedidos encontrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pedidos/novo')}>
          + Novo Pedido
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="filters-bar">
            <select
              className="form-control"
              style={{ width: '150px' }}
              value={statusFiltro}
              onChange={e => setStatusFiltro(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="fechado">Fechado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
            <input
              type="date"
              className="form-control"
              style={{ width: 'auto' }}
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => { setStatusFiltro(''); setDataInicio(''); setDataFim(''); }}>
              Limpar
            </button>
          </div>

          {carregando ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
          ) : pedidos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <h3>Nenhum pedido encontrado</h3>
              <p>Crie um novo pedido clicando em "+ Novo Pedido"</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Data/Hora</th>
                    <th>Cliente</th>
                    <th>Atendente</th>
                    <th>Total</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.id}>
                      <td><strong>#{p.id}</strong></td>
                      <td>{formatarData(p.created_at)}</td>
                      <td>{p.cliente_nome || <span style={{ color: 'var(--text-light)' }}>Sem cliente</span>}</td>
                      <td>{p.usuario_nome}</td>
                      <td><strong>{formatarMoeda(p.total)}</strong></td>
                      <td>
                        {p.forma_pagamento ? (
                          <span className={`badge ${PAGAMENTOS[p.forma_pagamento]?.badge || 'badge-gray'}`}>
                            {PAGAMENTOS[p.forma_pagamento]?.label || p.forma_pagamento}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${STATUS[p.status]?.badge || 'badge-gray'}`}>
                          {STATUS[p.status]?.label || p.status}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          {p.status === 'aberto' && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/pedidos/${p.id}`)}
                              >
                                Abrir
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleCancelar(p)}>
                                Cancelar
                              </button>
                            </>
                          )}
                          {p.status !== 'aberto' && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/pedidos/${p.id}`)}
                            >
                              Ver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
