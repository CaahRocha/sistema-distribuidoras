import { useState, useEffect } from 'react';
import { estoqueService, produtosService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatarData = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Estoque() {
  const [estoque, setEstoque] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState('estoque');
  const [busca, setBusca] = useState('');
  const [apenasAlerta, setApenasAlerta] = useState(false);
  const [modalEntrada, setModalEntrada] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [erro, setErro] = useState('');
  const { isAdmin } = useAuth();

  const [formEntrada, setFormEntrada] = useState({ produto_id: '', quantidade: '', motivo: '' });
  const [formAjuste, setFormAjuste] = useState({ produto_id: '', quantidade_nova: '', motivo: '' });

  useEffect(() => {
    carregarDados();
  }, [aba]);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      if (aba === 'estoque') {
        const data = await estoqueService.listar();
        setEstoque(data);
      } else {
        const data = await estoqueService.movimentacoes();
        setMovimentacoes(data);
      }

      const prods = await produtosService.listar();
      setProdutos(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const handleEntrada = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await estoqueService.entrada({
        produto_id: parseInt(formEntrada.produto_id),
        quantidade: parseFloat(formEntrada.quantidade),
        motivo: formEntrada.motivo
      });
      setModalEntrada(false);
      setFormEntrada({ produto_id: '', quantidade: '', motivo: '' });
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleAjuste = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await estoqueService.ajuste({
        produto_id: parseInt(formAjuste.produto_id),
        quantidade_nova: parseFloat(formAjuste.quantidade_nova),
        motivo: formAjuste.motivo
      });
      setModalAjuste(false);
      setFormAjuste({ produto_id: '', quantidade_nova: '', motivo: '' });
      carregarDados();
    } catch (err) {
      setErro(err.message);
    }
  };

  const estoqueFiltrado = estoque.filter(p => {
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo && p.codigo.includes(busca));
    const matchAlerta = !apenasAlerta || p.alerta_estoque;
    return matchBusca && matchAlerta;
  });

  const alertas = estoque.filter(p => p.alerta_estoque).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Estoque</h2>
          <p className="page-subtitle">
            {estoque.length} produtos
            {alertas > 0 && <span style={{ color: 'var(--warning)', marginLeft: '8px' }}>⚠️ {alertas} abaixo do mínimo</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-success" onClick={() => { setErro(''); setModalEntrada(true); }}>
            ↑ Entrada
          </button>
          {isAdmin() && (
            <button className="btn btn-ghost" onClick={() => { setErro(''); setModalAjuste(true); }}>
              ⚙️ Ajustar
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        <div className="tabs">
          <button className={`tab-btn ${aba === 'estoque' ? 'active' : ''}`} onClick={() => setAba('estoque')}>
            Estoque Atual
          </button>
          <button className={`tab-btn ${aba === 'movimentacoes' ? 'active' : ''}`} onClick={() => setAba('movimentacoes')}>
            Movimentações
          </button>
        </div>

        {aba === 'estoque' && (
          <div className="card">
            <div className="filters-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={apenasAlerta} onChange={e => setApenasAlerta(e.target.checked)} />
                Apenas alertas
              </label>
            </div>

            {carregando ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Unidade</th>
                      <th>Estoque Atual</th>
                      <th>Estoque Mínimo</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoqueFiltrado.map(p => (
                      <tr key={p.id}>
                        <td>{p.codigo || '—'}</td>
                        <td><strong>{p.nome}</strong></td>
                        <td>{p.categoria_nome || '—'}</td>
                        <td>{p.unidade}</td>
                        <td><strong>{p.estoque_atual}</strong></td>
                        <td>{p.estoque_minimo}</td>
                        <td>
                          {p.estoque_atual <= 0 ? (
                            <span className="badge badge-danger">Sem estoque</span>
                          ) : p.alerta_estoque ? (
                            <span className="badge badge-warning">⚠️ Baixo</span>
                          ) : (
                            <span className="badge badge-success">OK</span>
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

        {aba === 'movimentacoes' && (
          <div className="card">
            {carregando ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Produto</th>
                      <th>Tipo</th>
                      <th>Quantidade</th>
                      <th>Motivo</th>
                      <th>Usuário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoes.map(m => (
                      <tr key={m.id}>
                        <td>{formatarData(m.created_at)}</td>
                        <td><strong>{m.produto_nome}</strong></td>
                        <td>
                          <span className={`badge ${m.tipo === 'entrada' ? 'badge-success' : m.tipo === 'saida' ? 'badge-danger' : 'badge-info'}`}>
                            {m.tipo === 'entrada' ? '↑ Entrada' : m.tipo === 'saida' ? '↓ Saída' : '⚙ Ajuste'}
                          </span>
                        </td>
                        <td>{m.quantidade} {m.unidade}</td>
                        <td>{m.motivo || '—'}</td>
                        <td>{m.usuario_nome || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Entrada */}
      {modalEntrada && (
        <div className="modal-overlay" onClick={() => setModalEntrada(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">↑ Registrar Entrada</h3>
              <button className="modal-close" onClick={() => setModalEntrada(false)}>✕</button>
            </div>
            <form onSubmit={handleEntrada}>
              <div className="modal-body">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-group">
                  <label className="form-label">Produto *</label>
                  <select className="form-control" value={formEntrada.produto_id} onChange={e => setFormEntrada({ ...formEntrada, produto_id: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (atual: {p.estoque_atual} {p.unidade})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantidade *</label>
                  <input className="form-control" type="number" step="0.01" min="0.01" value={formEntrada.quantidade} onChange={e => setFormEntrada({ ...formEntrada, quantidade: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo / Observação</label>
                  <input className="form-control" value={formEntrada.motivo} onChange={e => setFormEntrada({ ...formEntrada, motivo: e.target.value })} placeholder="Ex: Compra de fornecedor" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalEntrada(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success">Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste */}
      {modalAjuste && (
        <div className="modal-overlay" onClick={() => setModalAjuste(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">⚙️ Ajustar Estoque</h3>
              <button className="modal-close" onClick={() => setModalAjuste(false)}>✕</button>
            </div>
            <form onSubmit={handleAjuste}>
              <div className="modal-body">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="alert alert-warning">⚠️ O ajuste irá sobrescrever a quantidade atual do estoque.</div>
                <div className="form-group">
                  <label className="form-label">Produto *</label>
                  <select className="form-control" value={formAjuste.produto_id} onChange={e => setFormAjuste({ ...formAjuste, produto_id: e.target.value })} required>
                    <option value="">Selecione...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (atual: {p.estoque_atual} {p.unidade})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nova Quantidade *</label>
                  <input className="form-control" type="number" step="0.01" min="0" value={formAjuste.quantidade_nova} onChange={e => setFormAjuste({ ...formAjuste, quantidade_nova: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo *</label>
                  <input className="form-control" value={formAjuste.motivo} onChange={e => setFormAjuste({ ...formAjuste, motivo: e.target.value })} placeholder="Ex: Inventário realizado" required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAjuste(false)}>Cancelar</button>
                <button type="submit" className="btn btn-warning">Confirmar Ajuste</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
