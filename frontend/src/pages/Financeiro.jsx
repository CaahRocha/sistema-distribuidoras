import { useState, useEffect } from 'react';
import { financeiroService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const formatarData = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Financeiro() {
  const [aba, setAba] = useState('fiado');
  const [fiados, setFiados] = useState([]);
  const [caixa, setCaixa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('aberto');
  const [dataCaixa, setDataCaixa] = useState(new Date().toISOString().split('T')[0]);
  const [modalPagar, setModalPagar] = useState(false);
  const [modalSaida, setModalSaida] = useState(false);
  const [fiadoSelecionado, setFiadoSelecionado] = useState(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');
  const [formSaida, setFormSaida] = useState({ valor: '', descricao: '' });
  const [erro, setErro] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    carregarDados();
  }, [aba, statusFiltro, dataCaixa]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      if (aba === 'fiado') {
        const params = {};
        if (statusFiltro) params.status = statusFiltro;
        const data = await financeiroService.listarFiado(params);
        setFiados(data);
      } else {
        const data = await financeiroService.caixa(dataCaixa);
        setCaixa(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalPagar = (fiado) => {
    setFiadoSelecionado(fiado);
    setValorPagamento(((fiado.valor_original - fiado.valor_pago)).toFixed(2));
    setObservacaoPagamento('');
    setErro('');
    setModalPagar(true);
  };

  const handlePagar = async () => {
    setErro('');
    try {
      await financeiroService.pagarFiado(fiadoSelecionado.id, {
        valor: parseFloat(valorPagamento),
        observacao: observacaoPagamento
      });
      setModalPagar(false);
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleSaida = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await financeiroService.registrarSaida({
        valor: parseFloat(formSaida.valor),
        descricao: formSaida.descricao
      });
      setModalSaida(false);
      setFormSaida({ valor: '', descricao: '' });
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  };

  const totalFiadoAberto = fiados
    .filter(f => f.status !== 'pago')
    .reduce((acc, f) => acc + (f.valor_original - f.valor_pago), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Financeiro</h2>
          <p className="page-subtitle">Fiado e controle de caixa</p>
        </div>
        {aba === 'caixa' && isAdmin() && (
          <button className="btn btn-danger" onClick={() => { setErro(''); setModalSaida(true); }}>
            ↓ Registrar Saída
          </button>
        )}
      </div>

      <div className="page-content">
        <div className="tabs">
          <button className={`tab-btn ${aba === 'fiado' ? 'active' : ''}`} onClick={() => setAba('fiado')}>
            📋 Fiado / Contas a Receber
          </button>
          <button className={`tab-btn ${aba === 'caixa' ? 'active' : ''}`} onClick={() => setAba('caixa')}>
            💰 Caixa do Dia
          </button>
        </div>

        {/* Aba Fiado */}
        {aba === 'fiado' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="filters-bar" style={{ margin: 0 }}>
                <select
                  className="form-control"
                  style={{ width: 'auto' }}
                  value={statusFiltro}
                  onChange={e => setStatusFiltro(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="aberto">Em aberto</option>
                  <option value="parcial">Parcialmente pago</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
              {totalFiadoAberto > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Total a receber</span>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>{formatarMoeda(totalFiadoAberto)}</p>
                </div>
              )}
            </div>

            {carregando ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
            ) : fiados.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>Nenhum fiado encontrado</h3>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Pedido</th>
                      <th>Valor Original</th>
                      <th>Valor Pago</th>
                      <th>Restante</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fiados.map(f => (
                      <tr key={f.id}>
                        <td>{new Date(f.created_at).toLocaleDateString('pt-BR')}</td>
                        <td><strong>{f.cliente_nome}</strong></td>
                        <td>{f.pedido_id ? `#${f.pedido_id}` : '—'}</td>
                        <td>{formatarMoeda(f.valor_original)}</td>
                        <td>{formatarMoeda(f.valor_pago)}</td>
                        <td className={f.valor_original - f.valor_pago > 0 ? 'text-danger font-bold' : 'text-success'}>
                          {formatarMoeda(f.valor_original - f.valor_pago)}
                        </td>
                        <td>
                          <span className={`badge badge-${f.status === 'pago' ? 'success' : f.status === 'parcial' ? 'warning' : 'danger'}`}>
                            {f.status === 'pago' ? '✅ Pago' : f.status === 'parcial' ? '⚡ Parcial' : '❌ Em aberto'}
                          </span>
                        </td>
                        <td>
                          {f.status !== 'pago' && (
                            <button className="btn btn-success btn-sm" onClick={() => abrirModalPagar(f)}>
                              Receber
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Aba Caixa */}
        {aba === 'caixa' && (
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
              <label className="form-label" style={{ margin: 0 }}>Data:</label>
              <input
                type="date"
                className="form-control"
                style={{ width: 'auto' }}
                value={dataCaixa}
                onChange={e => setDataCaixa(e.target.value)}
              />
            </div>

            {caixa && (
              <>
                <div className="cards-grid" style={{ marginBottom: '16px' }}>
                  <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
                    <div className="stat-card-icon">↑</div>
                    <div className="stat-card-value text-success">{formatarMoeda(caixa.total_entradas)}</div>
                    <div className="stat-card-label">Total de Entradas</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div className="stat-card-icon">↓</div>
                    <div className="stat-card-value text-danger">{formatarMoeda(caixa.total_saidas)}</div>
                    <div className="stat-card-label">Total de Saídas</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: `3px solid ${caixa.saldo >= 0 ? 'var(--primary)' : 'var(--danger)'}` }}>
                    <div className="stat-card-icon">💰</div>
                    <div className="stat-card-value" style={{ color: caixa.saldo >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      {formatarMoeda(caixa.saldo)}
                    </div>
                    <div className="stat-card-label">Saldo do Dia</div>
                  </div>
                </div>

                <div className="card">
                  {caixa.movimentacoes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <h3>Nenhuma movimentação neste dia</h3>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Hora</th>
                            <th>Descrição</th>
                            <th>Pagamento</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {caixa.movimentacoes.map(m => (
                            <tr key={m.id}>
                              <td>{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                              <td>{m.descricao || '—'}</td>
                              <td>{m.forma_pagamento || '—'}</td>
                              <td>
                                <span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : 'badge-danger'}`}>
                                  {m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                                </span>
                              </td>
                              <td className={`font-bold ${m.tipo === 'entrada' ? 'text-success' : 'text-danger'}`}>
                                {m.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(m.valor)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Receber Fiado */}
      {modalPagar && fiadoSelecionado && (
        <div className="modal-overlay" onClick={() => setModalPagar(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receber Fiado</h3>
              <button className="modal-close" onClick={() => setModalPagar(false)}>✕</button>
            </div>
            <div className="modal-body">
              {erro && <div className="alert alert-danger">{erro}</div>}
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: '14px' }}>
                <p><strong>Cliente:</strong> {fiadoSelecionado.cliente_nome}</p>
                <p><strong>Valor original:</strong> {formatarMoeda(fiadoSelecionado.valor_original)}</p>
                <p><strong>Já pago:</strong> {formatarMoeda(fiadoSelecionado.valor_pago)}</p>
                <p style={{ color: 'var(--danger)', fontWeight: 700 }}>
                  <strong>Restante:</strong> {formatarMoeda(fiadoSelecionado.valor_original - fiadoSelecionado.valor_pago)}
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Valor a Receber (R$) *</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={fiadoSelecionado.valor_original - fiadoSelecionado.valor_pago}
                  value={valorPagamento}
                  onChange={e => setValorPagamento(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Observação</label>
                <input
                  className="form-control"
                  value={observacaoPagamento}
                  onChange={e => setObservacaoPagamento(e.target.value)}
                  placeholder="Opcional..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalPagar(false)}>Cancelar</button>
              <button className="btn btn-success" onClick={handlePagar}>Confirmar Recebimento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Saída de Caixa */}
      {modalSaida && (
        <div className="modal-overlay" onClick={() => setModalSaida(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">↓ Registrar Saída de Caixa</h3>
              <button className="modal-close" onClick={() => setModalSaida(false)}>✕</button>
            </div>
            <form onSubmit={handleSaida}>
              <div className="modal-body">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-group">
                  <label className="form-label">Valor (R$) *</label>
                  <input className="form-control" type="number" step="0.01" min="0.01" value={formSaida.valor} onChange={e => setFormSaida({ ...formSaida, valor: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input className="form-control" value={formSaida.descricao} onChange={e => setFormSaida({ ...formSaida, descricao: e.target.value })} placeholder="Ex: Pagamento de fornecedor" required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalSaida(false)}>Cancelar</button>
                <button type="submit" className="btn btn-danger">Registrar Saída</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
