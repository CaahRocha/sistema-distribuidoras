import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pedidosService, produtosService, clientesService } from '../services/api';

const UNIDADES = ['UN', 'CX', 'FD', 'PCT', 'KG', 'L', 'DZ'];

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export default function NovoPedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Modo de adição: 'produto' ou 'avulso'
  const [modoAdicao, setModoAdicao] = useState('produto');

  // Busca de produto cadastrado
  const [busca, setBusca] = useState('');
  const [produtosBuscados, setProdutosBuscados] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);

  // Item avulso
  const [nomeAvulso, setNomeAvulso] = useState('');
  const [qtdAvulso, setQtdAvulso] = useState(1);
  const [precoAvulso, setPrecoAvulso] = useState('');

  // Modal fechar pedido
  const [modalFechar, setModalFechar] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacao, setObservacao] = useState('');
  const [clienteId, setClienteId] = useState('');

  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Modal cadastrar produto rápido
  const [modalCadastrar, setModalCadastrar] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [erroCadastro, setErroCadastro] = useState('');
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [formCadastrar, setFormCadastrar] = useState({
    nome: '', codigo_barras: '', categoria_id: '', unidade: 'UN',
    preco_custo: '', preco_venda: '', estoque_atual: '', estoque_minimo: ''
  });

  useEffect(() => {
    inicializar();
  }, [id]);

  const inicializar = async () => {
    try {
      const [prods, clts, cats] = await Promise.all([
        produtosService.listar(),
        clientesService.listar(),
        produtosService.listarCategorias()
      ]);
      setProdutos(prods);
      setClientes(clts);
      setCategorias(cats);
      if (id) {
        const ped = await pedidosService.buscar(id);
        setPedido(ped);
        setClienteId(ped.cliente_id || '');
      } else {
        const novo = await pedidosService.criar({});
        const ped = await pedidosService.buscar(novo.id);
        setPedido(ped);
        navigate(`/pedidos/${novo.id}`, { replace: true });
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // Busca de produtos em tempo real (nome, código interno ou código de barras)
  useEffect(() => {
    if (busca.length >= 2) {
      const filtrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase())) ||
        (p.codigo_barras && p.codigo_barras.includes(busca))
      );
      setProdutosBuscados(filtrados.slice(0, 8));
    } else {
      setProdutosBuscados([]);
    }
  }, [busca, produtos]);

  const selecionarProduto = (produto) => {
    setProdutoSelecionado(produto);
    setBusca(produto.nome);
    setProdutosBuscados([]);
    setQuantidade(1);
  };

  // Adicionar produto cadastrado
  const adicionarProduto = async () => {
    if (!produtoSelecionado || quantidade <= 0) return;
    setErro('');
    try {
      await pedidosService.adicionarItem(pedido.id, {
        produto_id: produtoSelecionado.id,
        quantidade: parseInt(quantidade, 10)
      });
      const ped = await pedidosService.buscar(pedido.id);
      setPedido(ped);
      setBusca('');
      setProdutoSelecionado(null);
      setQuantidade(1);
    } catch (err) {
      setErro(err.message);
    }
  };

  // Adicionar item avulso (sem produto cadastrado)
  const adicionarAvulso = async () => {
    if (!nomeAvulso.trim() || !qtdAvulso || !precoAvulso) {
      setErro('Preencha o nome, a quantidade e o preço do item avulso');
      return;
    }
    setErro('');
    try {
      await pedidosService.adicionarItem(pedido.id, {
        nome_produto: nomeAvulso.trim(),
        quantidade: parseInt(qtdAvulso, 10),
        preco_unitario: parseFloat(precoAvulso)
      });
      const ped = await pedidosService.buscar(pedido.id);
      setPedido(ped);
      setNomeAvulso('');
      setQtdAvulso(1);
      setPrecoAvulso('');
    } catch (err) {
      setErro(err.message);
    }
  };

  // Abrir modal de cadastro pré-preenchido com os dados do avulso
  const abrirCadastrarProduto = () => {
    setFormCadastrar({
      nome: nomeAvulso,
      codigo_barras: '',
      categoria_id: '',
      unidade: 'UN',
      preco_custo: '',
      preco_venda: precoAvulso || '',
      estoque_atual: '',
      estoque_minimo: ''
    });
    setErroCadastro('');
    setModalCadastrar(true);
  };

  // Cadastrar produto e já selecioná-lo automaticamente
  const handleCadastrarProduto = async (e) => {
    e.preventDefault();
    setErroCadastro('');
    setSalvandoProduto(true);

    try {
      const resultado = await produtosService.criar({
        nome: formCadastrar.nome,
        codigo_barras: formCadastrar.codigo_barras || null,
        categoria_id: formCadastrar.categoria_id || null,
        unidade: formCadastrar.unidade,
        preco_custo: parseFloat(formCadastrar.preco_custo) || 0,
        preco_venda: parseFloat(formCadastrar.preco_venda),
        estoque_atual: parseFloat(formCadastrar.estoque_atual) || 0,
        estoque_minimo: parseFloat(formCadastrar.estoque_minimo) || 0
      });

      // Recarregar lista e selecionar o produto recém criado
      const prodsAtualizados = await produtosService.listar();
      setProdutos(prodsAtualizados);

      const novoProduto = prodsAtualizados.find(p => p.id === resultado.id);

      setModalCadastrar(false);
      setModoAdicao('produto');
      setNomeAvulso('');
      setQtdAvulso(1);
      setPrecoAvulso('');

      if (novoProduto) {
        selecionarProduto(novoProduto);
      }
    } catch (err) {
      setErroCadastro(err.message);
    } finally {
      setSalvandoProduto(false);
    }
  };

  const removerItem = async (itemId) => {    try {
      await pedidosService.removerItem(pedido.id, itemId);
      const ped = await pedidosService.buscar(pedido.id);
      setPedido(ped);
    } catch (err) {
      alert(err.message);
    }
  };

  const fecharPedido = async () => {
    if (!formaPagamento) {
      setErro('Selecione a forma de pagamento');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await pedidosService.fechar(pedido.id, {
        forma_pagamento: formaPagamento,
        observacao,
        cliente_id: clienteId || null
      });
      navigate('/pedidos');
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  };

  const cancelarPedido = async () => {
    if (!confirm('Cancelar este pedido?')) return;
    try {
      await pedidosService.cancelar(pedido.id);
      navigate('/pedidos');
    } catch (err) {
      alert(err.message);
    }
  };

  if (carregando) return <div className="loading-screen">Carregando pedido...</div>;

  const pedidoFechado = pedido?.status !== 'aberto';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {pedidoFechado ? `Pedido #${pedido?.id}` : `Pedido #${pedido?.id} — em andamento`}
          </h2>
          <p className="page-subtitle">
            {pedidoFechado
              ? `Status: ${pedido?.status} | ${pedido?.forma_pagamento || ''}`
              : 'Adicione produtos e feche o pedido'}
          </p>
        </div>
        {!pedidoFechado ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-ghost" onClick={cancelarPedido}>Cancelar Pedido</button>
            <button
              className="btn btn-success"
              disabled={!pedido?.itens?.length}
              onClick={() => { setErro(''); setModalFechar(true); }}
            >
              ✅ Fechar Pedido
            </button>
          </div>
        ) : (
          <button className="btn btn-ghost" onClick={() => navigate('/pedidos')}>← Voltar</button>
        )}
      </div>

      <div className="page-content" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Adicionar produto */}
          {!pedidoFechado && (
            <div className="card">
              {/* Tabs produto / avulso */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
                <button
                  className={`tab-btn ${modoAdicao === 'produto' ? 'active' : ''}`}
                  style={{ marginBottom: 0 }}
                  onClick={() => { setModoAdicao('produto'); setErro(''); }}
                >
                  🔍 Produto Cadastrado
                </button>
                <button
                  className={`tab-btn ${modoAdicao === 'avulso' ? 'active' : ''}`}
                  style={{ marginBottom: 0 }}
                  onClick={() => { setModoAdicao('avulso'); setErro(''); }}
                >
                  ✏️ Item Avulso
                </button>
              </div>

              {erro && <div className="alert alert-danger">{erro}</div>}

              {/* Modo produto cadastrado */}
              {modoAdicao === 'produto' && (
                <div>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-control"
                      placeholder="Nome, código ou código de barras... (leitor funciona aqui)"
                      value={busca}
                      onChange={e => { setBusca(e.target.value); setProdutoSelecionado(null); }}
                      onKeyDown={e => {
                        // Leitor de código de barras envia Enter ao final — auto-seleciona se único resultado
                        if (e.key === 'Enter' && produtosBuscados.length === 1) {
                          selecionarProduto(produtosBuscados[0]);
                        }
                      }}
                      autoFocus
                    />

                    {/* Dropdown de resultados */}
                    {produtosBuscados.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                        background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow-md)', maxHeight: '260px', overflowY: 'auto', marginTop: '2px'
                      }}>
                        {produtosBuscados.map(p => (
                          <div
                            key={p.id}
                            onMouseDown={() => selecionarProduto(p)}
                            style={{
                              padding: '10px 14px', cursor: 'pointer', display: 'flex',
                              justifyContent: 'space-between', alignItems: 'center',
                              borderBottom: '1px solid var(--border)', userSelect: 'none'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            <div>
                              <strong style={{ fontSize: '13px' }}>{p.nome}</strong>
                              {p.codigo && <span style={{ color: 'var(--text-light)', fontSize: '11px', marginLeft: '6px' }}>#{p.codigo}</span>}
                              <div style={{ fontSize: '11px', color: p.estoque_atual <= 0 ? 'var(--danger)' : 'var(--text-light)', marginTop: '1px' }}>
                                Estoque: {p.estoque_atual} {p.unidade}
                              </div>
                            </div>
                            <strong style={{ color: 'var(--primary)', fontSize: '14px' }}>
                              {formatarMoeda(p.preco_venda)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sem resultados */}
                    {busca.length >= 2 && produtosBuscados.length === 0 && !produtoSelecionado && (
                      <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--warning-light)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                        ⚠️ Nenhum produto encontrado. Use a aba <strong>"Item Avulso"</strong> para adicionar sem cadastro, ou cadastre em <strong>Produtos</strong>.
                      </div>
                    )}
                  </div>

                  {/* Produto selecionado + quantidade */}
                  {produtoSelecionado && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, background: 'var(--primary-light)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                        <strong>{produtoSelecionado.nome}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--primary)', marginLeft: '8px', fontWeight: 600 }}>
                          {formatarMoeda(produtoSelecionado.preco_venda)} / {produtoSelecionado.unidade}
                        </span>
                      </div>
                      <div style={{ width: '90px' }}>
                        <label className="form-label">Qtd</label>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          step="1"
                          value={quantidade}
                          onChange={e => setQuantidade(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && adicionarProduto()}
                          autoFocus
                        />
                      </div>
                      <button className="btn btn-primary" onClick={adicionarProduto}>+ Adicionar</button>
                    </div>
                  )}
                </div>
              )}

              {/* Modo item avulso */}
              {modoAdicao === 'avulso' && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
                    Adicione um item que não está cadastrado no sistema. Informe o nome, quantidade e preço.
                  </p>
                  <div className="form-row-3">
                    <div className="form-group" style={{ gridColumn: 'span 1' }}>
                      <label className="form-label">Nome do Item *</label>
                      <input
                        className="form-control"
                        value={nomeAvulso}
                        onChange={e => setNomeAvulso(e.target.value)}
                        placeholder="Ex: Cerveja Brahma 350ml"
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quantidade *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        step="1"
                        value={qtdAvulso}
                        onChange={e => setQtdAvulso(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Preço Unit. (R$) *</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0.01"
                        step="0.01"
                        value={precoAvulso}
                        onChange={e => setPrecoAvulso(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  {/* Subtotal preview */}
                  {qtdAvulso > 0 && precoAvulso > 0 && (
                    <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                      Subtotal: <strong>{formatarMoeda(parseFloat(qtdAvulso) * parseFloat(precoAvulso))}</strong>
                    </div>
                  )}

                  <button className="btn btn-primary" onClick={adicionarAvulso}>
                    + Adicionar Item Avulso
                  </button>

                  {/* Dica para cadastrar o produto */}
                  <div style={{
                    marginTop: '14px', padding: '12px 14px',
                    background: 'var(--primary-light)', borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', flex: 1 }}>
                      💡 Vende esse item com frequência? Cadastre-o para controlar o estoque.
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={abrirCadastrarProduto}
                    >
                      📝 Cadastrar Produto
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Itens do pedido */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📋 Itens do Pedido</span>
              <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>{pedido?.itens?.length || 0} item(s)</span>
            </div>

            {!pedido?.itens?.length ? (
              <div className="empty-state" style={{ padding: '28px' }}>
                <div className="empty-state-icon" style={{ fontSize: '32px' }}>🛒</div>
                <p>Nenhum item adicionado ainda</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                      <th>Unitário</th>
                      <th>Subtotal</th>
                      {!pedidoFechado && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.itens.map(item => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.produto_nome}</strong>
                          {!item.produto_id && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', background: 'var(--warning-light)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                              avulso
                            </span>
                          )}
                          {item.codigo && <span style={{ color: 'var(--text-light)', fontSize: '11px', marginLeft: '6px' }}>#{item.codigo}</span>}
                        </td>
                        <td>{item.quantidade} {item.unidade}</td>
                        <td>{formatarMoeda(item.preco_unitario)}</td>
                        <td><strong>{formatarMoeda(item.subtotal)}</strong></td>
                        {!pedidoFechado && (
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => removerItem(item.id)}>✕</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: resumo */}
        <div className="card" style={{ position: 'sticky', top: '20px' }}>
          <div className="card-header">
            <span className="card-title">💵 Resumo</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pedido?.cliente_nome && (
              <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>Cliente</span>
                <p style={{ fontWeight: 600 }}>{pedido.cliente_nome}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-light)' }}>Itens</span>
              <strong>{pedido?.itens?.length || 0}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>TOTAL</span>
              <span style={{ fontWeight: 800, fontSize: '24px', color: 'var(--primary)' }}>
                {formatarMoeda(pedido?.total)}
              </span>
            </div>

            {pedidoFechado && pedido?.forma_pagamento && (
              <div style={{ padding: '10px', background: 'var(--success-light)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Pago com {pedido.forma_pagamento}</span>
              </div>
            )}

            {!pedidoFechado && (
              <button
                className="btn btn-success btn-lg w-full"
                disabled={!pedido?.itens?.length}
                onClick={() => { setErro(''); setModalFechar(true); }}
              >
                ✅ Fechar Pedido
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Cadastrar Produto */}
      {modalCadastrar && (
        <div className="modal-overlay" onClick={() => setModalCadastrar(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">📝 Cadastrar Produto</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
                  Após salvar, o produto entra no catálogo e fica selecionado automaticamente.
                </p>
              </div>
              <button className="modal-close" onClick={() => setModalCadastrar(false)}>✕</button>
            </div>
            <form onSubmit={handleCadastrarProduto}>
              <div className="modal-body">
                {erroCadastro && <div className="alert alert-danger">{erroCadastro}</div>}

                <div className="form-group">
                  <label className="form-label">Nome do Produto *</label>
                  <input
                    className="form-control"
                    value={formCadastrar.nome}
                    onChange={e => setFormCadastrar({ ...formCadastrar, nome: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código de Barras (EAN)</label>
                  <input
                    className="form-control"
                    value={formCadastrar.codigo_barras}
                    onChange={e => setFormCadastrar({ ...formCadastrar, codigo_barras: e.target.value })}
                    placeholder="Escaneie ou digite o código de barras"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select className="form-control" value={formCadastrar.categoria_id} onChange={e => setFormCadastrar({ ...formCadastrar, categoria_id: e.target.value })}>
                      <option value="">Sem categoria</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unidade</label>
                    <select className="form-control" value={formCadastrar.unidade} onChange={e => setFormCadastrar({ ...formCadastrar, unidade: e.target.value })}>
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preço de Custo (R$)</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="form-control"
                      value={formCadastrar.preco_custo}
                      onChange={e => setFormCadastrar({ ...formCadastrar, preco_custo: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço de Venda (R$) *</label>
                    <input
                      type="number" step="0.01" min="0.01"
                      className="form-control"
                      value={formCadastrar.preco_venda}
                      onChange={e => setFormCadastrar({ ...formCadastrar, preco_venda: e.target.value })}
                      required
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estoque Inicial</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="form-control"
                      value={formCadastrar.estoque_atual}
                      onChange={e => setFormCadastrar({ ...formCadastrar, estoque_atual: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estoque Mínimo</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="form-control"
                      value={formCadastrar.estoque_minimo}
                      onChange={e => setFormCadastrar({ ...formCadastrar, estoque_minimo: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalCadastrar(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={salvandoProduto}>
                  {salvandoProduto ? 'Salvando...' : '✅ Cadastrar e Usar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar Pedido */}      {modalFechar && (
        <div className="modal-overlay" onClick={() => setModalFechar(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Fechar Pedido #{pedido?.id}</h3>
              <button className="modal-close" onClick={() => setModalFechar(false)}>✕</button>
            </div>
            <div className="modal-body">
              {erro && <div className="alert alert-danger">{erro}</div>}

              <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
                <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Total do pedido</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>{formatarMoeda(pedido?.total)}</p>
              </div>

              <div className="form-group">
                <label className="form-label">Cliente (opcional)</label>
                <select className="form-control" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                  <option value="">Sem cliente (venda avulsa)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome}{c.total_fiado > 0 ? ` (Fiado: ${formatarMoeda(c.total_fiado)})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Forma de Pagamento *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { value: 'dinheiro', label: '💵 Dinheiro' },
                    { value: 'pix',     label: '📲 PIX' },
                    { value: 'cartao',  label: '💳 Cartão' },
                    { value: 'fiado',   label: '📋 Fiado' }
                  ].map(op => (
                    <button
                      key={op.value}
                      type="button"
                      className={`btn ${formaPagamento === op.value ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setFormaPagamento(op.value)}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {formaPagamento === 'fiado' && !clienteId && (
                <div className="alert alert-warning">⚠️ Selecione um cliente para registrar no fiado.</div>
              )}

              <div className="form-group">
                <label className="form-label">Observação</label>
                <input
                  className="form-control"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Opcional..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setModalFechar(false)}>Cancelar</button>
              <button
                className="btn btn-success"
                onClick={fecharPedido}
                disabled={salvando || !formaPagamento || (formaPagamento === 'fiado' && !clienteId)}
              >
                {salvando ? 'Fechando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
