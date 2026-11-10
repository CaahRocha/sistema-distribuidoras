import { useState, useEffect } from 'react';
import { clientesService, financeiroService } from '../services/api';

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalFiado, setModalFiado] = useState(false);
  const [clienteAtual, setClienteAtual] = useState(null);
  const [fiadoCliente, setFiadoCliente] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', endereco: '', limite_fiado: '' });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const data = await clientesService.listar();
      setClientes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (cliente = null) => {
    setClienteAtual(cliente);
    setForm(cliente ? {
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      limite_fiado: cliente.limite_fiado || ''
    } : { nome: '', telefone: '', endereco: '', limite_fiado: '' });
    setErro('');
    setModalAberto(true);
  };

  const verFiado = async (cliente) => {
    try {
      const data = await financeiroService.fiadoPorCliente(cliente.id);
      setFiadoCliente(data);
      setModalFiado(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      const dados = {
        nome: form.nome,
        telefone: form.telefone || null,
        endereco: form.endereco || null,
        limite_fiado: parseFloat(form.limite_fiado) || 0
      };

      if (clienteAtual) {
        await clientesService.editar(clienteAtual.id, dados);
      } else {
        await clientesService.criar(dados);
      }

      setModalAberto(false);
      carregarClientes();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDesativar = async (cliente) => {
    if (!confirm(`Desativar o cliente "${cliente.nome}"?`)) return;
    try {
      await clientesService.desativar(cliente.id);
      carregarClientes();
    } catch (err) {
      alert(err.message);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone && c.telefone.includes(busca))
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Clientes</h2>
          <p className="page-subtitle">{clientes.length} clientes cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>
          + Novo Cliente
        </button>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="filters-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome ou telefone..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
          ) : clientesFiltrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>Nenhum cliente encontrado</h3>
              <p>Cadastre o primeiro cliente clicando em "+ Novo Cliente"</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Endereço</th>
                    <th>Limite Fiado</th>
                    <th>Fiado em Aberto</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.nome}</strong></td>
                      <td>{c.telefone || '—'}</td>
                      <td>{c.endereco || '—'}</td>
                      <td>{c.limite_fiado > 0 ? formatarMoeda(c.limite_fiado) : 'Sem limite'}</td>
                      <td>
                        {c.total_fiado > 0 ? (
                          <span className="badge badge-danger">{formatarMoeda(c.total_fiado)}</span>
                        ) : (
                          <span className="badge badge-success">Em dia</span>
                        )}
                      </td>
                      <td>
                        <div className="actions">
                          {c.total_fiado > 0 && (
                            <button className="btn btn-warning btn-sm" onClick={() => verFiado(c)}>
                              Fiado
                            </button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => abrirModal(c)}>
                            Editar
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDesativar(c)}>
                            Excluir
                          </button>
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

      {/* Modal Novo/Editar Cliente */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{clienteAtual ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required autoFocus />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input className="form-control" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Limite de Fiado (R$)</label>
                    <input className="form-control" type="number" step="0.01" min="0" value={form.limite_fiado} onChange={e => setForm({ ...form, limite_fiado: e.target.value })} placeholder="0 = sem limite" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input className="form-control" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fiado do Cliente */}
      {modalFiado && fiadoCliente && (
        <div className="modal-overlay" onClick={() => setModalFiado(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Fiado — {fiadoCliente.cliente.nome}</h3>
                <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '2px' }}>
                  Total em aberto: {formatarMoeda(fiadoCliente.total_em_aberto)}
                </p>
              </div>
              <button className="modal-close" onClick={() => setModalFiado(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Valor Original</th>
                      <th>Valor Pago</th>
                      <th>Restante</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fiadoCliente.fiados.map(f => (
                      <tr key={f.id}>
                        <td>{new Date(f.created_at).toLocaleDateString('pt-BR')}</td>
                        <td>{formatarMoeda(f.valor_original)}</td>
                        <td>{formatarMoeda(f.valor_pago)}</td>
                        <td className={f.valor_original - f.valor_pago > 0 ? 'text-danger font-bold' : ''}>
                          {formatarMoeda(f.valor_original - f.valor_pago)}
                        </td>
                        <td>
                          <span className={`badge badge-${f.status === 'pago' ? 'success' : f.status === 'parcial' ? 'warning' : 'danger'}`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
