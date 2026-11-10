import { useState, useEffect } from 'react';
import { produtosService } from '../services/api';

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [produtoAtual, setProdutoAtual] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [form, setForm] = useState({
    codigo: '', nome: '', categoria_id: '', unidade: 'UN',
    preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [prods, cats] = await Promise.all([
        produtosService.listar(),
        produtosService.listarCategorias()
      ]);
      setProdutos(prods);
      setCategorias(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (produto = null) => {
    setProdutoAtual(produto);
    setForm(produto ? {
      codigo: produto.codigo || '',
      codigo_barras: produto.codigo_barras || '',
      nome: produto.nome,
      categoria_id: produto.categoria_id || '',
      unidade: produto.unidade || 'UN',
      preco_custo: produto.preco_custo || '',
      preco_venda: produto.preco_venda || '',
      estoque_atual: produto.estoque_atual || '',
      estoque_minimo: produto.estoque_minimo || ''
    } : {
      codigo: '', codigo_barras: '', nome: '', categoria_id: '', unidade: 'UN',
      preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: ''
    });
    setErro('');
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      const dados = {
        codigo: form.codigo || null,
        codigo_barras: form.codigo_barras || null,
        nome: form.nome,
        categoria_id: form.categoria_id || null,
        unidade: form.unidade,
        preco_custo: parseFloat(form.preco_custo) || 0,
        preco_venda: parseFloat(form.preco_venda),
        estoque_atual: parseFloat(form.estoque_atual) || 0,
        estoque_minimo: parseFloat(form.estoque_minimo) || 0
      };

      if (produtoAtual) {
        await produtosService.editar(produtoAtual.id, dados);
      } else {
        await produtosService.criar(dados);
      }

      setModalAberto(false);
      carregarDados();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleDesativar = async (produto) => {
    if (!confirm(`Desativar o produto "${produto.nome}"?`)) return;
    try {
      await produtosService.desativar(produto.id);
      carregarDados();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCriarCategoria = async (e) => {
    e.preventDefault();
    try {
      await produtosService.criarCategoria(novaCategoria);
      setNovaCategoria('');
      setModalCategoria(false);
      const cats = await produtosService.listarCategorias();
      setCategorias(cats);
    } catch (err) {
      alert(err.message);
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.codigo && p.codigo.includes(busca));
    const matchCat = !categoriaFiltro || p.categoria_id == categoriaFiltro;
    return matchBusca && matchCat;
  });

  const unidades = ['UN', 'CX', 'FD', 'PCT', 'KG', 'L', 'DZ'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Produtos</h2>
          <p className="page-subtitle">{produtos.length} produtos cadastrados</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => setModalCategoria(true)}>+ Categoria</button>
          <button className="btn btn-primary" onClick={() => abrirModal()}>+ Novo Produto</button>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="filters-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nome ou código..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          {carregando ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
          ) : produtosFiltrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>Nenhum produto encontrado</h3>
              <p>Cadastre o primeiro produto clicando em "+ Novo Produto"</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Unidade</th>
                    <th>Custo</th>
                    <th>Venda</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map(p => (
                    <tr key={p.id}>
                      <td>{p.codigo || '—'}</td>
                      <td><strong>{p.nome}</strong></td>
                      <td>{p.categoria_nome || '—'}</td>
                      <td>{p.unidade}</td>
                      <td>{formatarMoeda(p.preco_custo)}</td>
                      <td><strong>{formatarMoeda(p.preco_venda)}</strong></td>
                      <td>
                        <span className={`badge ${p.estoque_atual <= p.estoque_minimo && p.estoque_minimo > 0 ? 'badge-warning' : 'badge-gray'}`}>
                          {p.estoque_atual} {p.unidade}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => abrirModal(p)}>Editar</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDesativar(p)}>Excluir</button>
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

      {/* Modal Produto */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{produtoAtual ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Código Interno</label>
                    <input className="form-control" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="Ex: CX-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidade</label>
                    <select className="form-control" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })}>
                      {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Código de Barras (EAN)</label>
                  <input
                    className="form-control"
                    value={form.codigo_barras}
                    onChange={e => setForm({ ...form, codigo_barras: e.target.value })}
                    placeholder="Escaneie ou digite o código de barras"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-control" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-control" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
                    <option value="">Sem categoria</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preço de Custo (R$)</label>
                    <input className="form-control" type="number" step="0.01" min="0" value={form.preco_custo} onChange={e => setForm({ ...form, preco_custo: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço de Venda (R$) *</label>
                    <input className="form-control" type="number" step="0.01" min="0" value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: e.target.value })} required />
                  </div>
                </div>
                {!produtoAtual && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Estoque Inicial</label>
                      <input className="form-control" type="number" step="0.01" min="0" value={form.estoque_atual} onChange={e => setForm({ ...form, estoque_atual: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estoque Mínimo</label>
                      <input className="form-control" type="number" step="0.01" min="0" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} />
                    </div>
                  </div>
                )}
                {produtoAtual && (
                  <div className="form-group">
                    <label className="form-label">Estoque Mínimo</label>
                    <input className="form-control" type="number" step="0.01" min="0" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} />
                  </div>
                )}
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

      {/* Modal Nova Categoria */}
      {modalCategoria && (
        <div className="modal-overlay" onClick={() => setModalCategoria(false)}>
          <div className="modal" style={{ maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Categoria</h3>
              <button className="modal-close" onClick={() => setModalCategoria(false)}>✕</button>
            </div>
            <form onSubmit={handleCriarCategoria}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Categoria *</label>
                  <input className="form-control" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} required autoFocus />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalCategoria(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
