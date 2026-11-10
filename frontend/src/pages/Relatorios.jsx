import { useState, useEffect } from 'react';
import { relatoriosService } from '../services/api';

const formatarMoeda = (v) => `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const mesAtual = () => {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
  const fim = hoje.toISOString().split('T')[0];
  return { inicio, fim };
};

export default function Relatorios() {
  const [aba, setAba] = useState('vendas');

  // Vendas
  const [vendas, setVendas] = useState(null);
  const [dataInicioVendas, setDataInicioVendas] = useState(mesAtual().inicio);
  const [dataFimVendas, setDataFimVendas] = useState(mesAtual().fim);

  // Produtos mais vendidos
  const [topProdutos, setTopProdutos] = useState(null);
  const [dataInicioTop, setDataInicioTop] = useState(mesAtual().inicio);
  const [dataFimTop, setDataFimTop] = useState(mesAtual().fim);

  // Estoque
  const [estoqueRel, setEstoqueRel] = useState(null);

  // Fiado
  const [fiadoRel, setFiadoRel] = useState(null);

  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarAba();
  }, [aba]);

  const carregarAba = async () => {
    setCarregando(true);
    try {
      if (aba === 'vendas') {
        const data = await relatoriosService.vendas({ data_inicio: dataInicioVendas, data_fim: dataFimVendas });
        setVendas(data);
      } else if (aba === 'produtos') {
        const data = await relatoriosService.produtosMaisVendidos({ data_inicio: dataInicioTop, data_fim: dataFimTop });
        setTopProdutos(data);
      } else if (aba === 'estoque') {
        const data = await relatoriosService.estoque();
        setEstoqueRel(data);
      } else if (aba === 'fiado') {
        const data = await relatoriosService.fiado();
        setFiadoRel(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const buscarVendas = async () => {
    setCarregando(true);
    try {
      const data = await relatoriosService.vendas({ data_inicio: dataInicioVendas, data_fim: dataFimVendas });
      setVendas(data);
    } finally {
      setCarregando(false);
    }
  };

  const buscarTopProdutos = async () => {
    setCarregando(true);
    try {
      const data = await relatoriosService.produtosMaisVendidos({ data_inicio: dataInicioTop, data_fim: dataFimTop });
      setTopProdutos(data);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Relatórios</h2>
          <p className="page-subtitle">Análises e dados do sistema</p>
        </div>
      </div>

      <div className="page-content">
        <div className="tabs">
          <button className={`tab-btn ${aba === 'vendas' ? 'active' : ''}`} onClick={() => setAba('vendas')}>📊 Vendas</button>
          <button className={`tab-btn ${aba === 'produtos' ? 'active' : ''}`} onClick={() => setAba('produtos')}>🏆 Top Produtos</button>
          <button className={`tab-btn ${aba === 'estoque' ? 'active' : ''}`} onClick={() => setAba('estoque')}>📦 Estoque</button>
          <button className={`tab-btn ${aba === 'fiado' ? 'active' : ''}`} onClick={() => setAba('fiado')}>📋 Fiado</button>
        </div>

        {/* Relatório de Vendas */}
        {aba === 'vendas' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data Início</label>
                  <input type="date" className="form-control" value={dataInicioVendas} onChange={e => setDataInicioVendas(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data Fim</label>
                  <input type="date" className="form-control" value={dataFimVendas} onChange={e => setDataFimVendas(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={buscarVendas}>Buscar</button>
              </div>
            </div>

            {carregando ? <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p> : vendas && (
              <>
                <div className="cards-grid" style={{ marginBottom: '16px' }}>
                  <div className="stat-card">
                    <div className="stat-card-icon">🛒</div>
                    <div className="stat-card-value">{vendas.resumo.total_pedidos}</div>
                    <div className="stat-card-label">Total de Pedidos</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">💵</div>
                    <div className="stat-card-value">{formatarMoeda(vendas.resumo.total_vendas)}</div>
                    <div className="stat-card-label">Total de Vendas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">💵</div>
                    <div className="stat-card-value">{formatarMoeda(vendas.resumo.total_dinheiro)}</div>
                    <div className="stat-card-label">Dinheiro</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">📲</div>
                    <div className="stat-card-value">{formatarMoeda(vendas.resumo.total_pix)}</div>
                    <div className="stat-card-label">PIX</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">💳</div>
                    <div className="stat-card-value">{formatarMoeda(vendas.resumo.total_cartao)}</div>
                    <div className="stat-card-label">Cartão</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">📋</div>
                    <div className="stat-card-value">{formatarMoeda(vendas.resumo.total_fiado)}</div>
                    <div className="stat-card-label">Fiado</div>
                  </div>
                </div>

                {vendas.por_dia.length > 0 && (
                  <div className="card">
                    <div className="card-title" style={{ marginBottom: '12px' }}>Vendas por Dia</div>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Pedidos</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendas.por_dia.map(d => (
                            <tr key={d.data}>
                              <td>{new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                              <td>{d.pedidos}</td>
                              <td><strong>{formatarMoeda(d.total)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Top Produtos */}
        {aba === 'produtos' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data Início</label>
                  <input type="date" className="form-control" value={dataInicioTop} onChange={e => setDataInicioTop(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Data Fim</label>
                  <input type="date" className="form-control" value={dataFimTop} onChange={e => setDataFimTop(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={buscarTopProdutos}>Buscar</button>
              </div>
            </div>

            {carregando ? <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p> : topProdutos && (
              <div className="card">
                {topProdutos.produtos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <h3>Nenhuma venda no período</h3>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Qtd Vendida</th>
                          <th>Pedidos</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProdutos.produtos.map((p, i) => (
                          <tr key={p.id}>
                            <td><strong>#{i + 1}</strong></td>
                            <td><strong>{p.nome}</strong></td>
                            <td>{p.categoria || '—'}</td>
                            <td>{p.total_vendido} {p.unidade}</td>
                            <td>{p.qtd_pedidos}</td>
                            <td><strong>{formatarMoeda(p.total_valor)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Estoque */}
        {aba === 'estoque' && (
          <>
            {carregando ? <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p> : estoqueRel && (
              <>
                <div className="cards-grid" style={{ marginBottom: '16px' }}>
                  <div className="stat-card">
                    <div className="stat-card-icon">📦</div>
                    <div className="stat-card-value">{estoqueRel.totais.total_produtos}</div>
                    <div className="stat-card-label">Total de Produtos</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">💰</div>
                    <div className="stat-card-value">{formatarMoeda(estoqueRel.totais.valor_total_custo)}</div>
                    <div className="stat-card-label">Valor em Custo</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">💵</div>
                    <div className="stat-card-value">{formatarMoeda(estoqueRel.totais.valor_total_venda)}</div>
                    <div className="stat-card-label">Valor em Venda</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: estoqueRel.totais.alertas > 0 ? '3px solid var(--warning)' : 'none' }}>
                    <div className="stat-card-icon">⚠️</div>
                    <div className="stat-card-value" style={{ color: estoqueRel.totais.alertas > 0 ? 'var(--warning)' : 'inherit' }}>
                      {estoqueRel.totais.alertas}
                    </div>
                    <div className="stat-card-label">Alertas</div>
                  </div>
                </div>

                <div className="card">
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Produto</th>
                          <th>Categoria</th>
                          <th>Unidade</th>
                          <th>Estoque</th>
                          <th>Mínimo</th>
                          <th>Valor (Custo)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estoqueRel.produtos.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.nome}</strong></td>
                            <td>{p.categoria || '—'}</td>
                            <td>{p.unidade}</td>
                            <td>{p.estoque_atual}</td>
                            <td>{p.estoque_minimo}</td>
                            <td>{formatarMoeda(p.valor_custo)}</td>
                            <td>
                              {p.alerta ? <span className="badge badge-warning">⚠️ Baixo</span> : <span className="badge badge-success">OK</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Fiado */}
        {aba === 'fiado' && (
          <>
            {carregando ? <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p> : fiadoRel && (
              <>
                <div className="stat-card" style={{ marginBottom: '16px', maxWidth: '280px', borderLeft: '3px solid var(--danger)' }}>
                  <div className="stat-card-icon">📋</div>
                  <div className="stat-card-value text-danger">{formatarMoeda(fiadoRel.total_a_receber)}</div>
                  <div className="stat-card-label">Total a Receber</div>
                </div>

                {fiadoRel.clientes.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <h3>Nenhum fiado em aberto</h3>
                  </div>
                ) : (
                  <div className="card">
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Telefone</th>
                            <th>Qtd Fiados</th>
                            <th>Total Original</th>
                            <th>Total Pago</th>
                            <th>Em Aberto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fiadoRel.clientes.map(c => (
                            <tr key={c.id}>
                              <td><strong>{c.nome}</strong></td>
                              <td>{c.telefone || '—'}</td>
                              <td>{c.qtd_fiados}</td>
                              <td>{formatarMoeda(c.total_original)}</td>
                              <td>{formatarMoeda(c.total_pago)}</td>
                              <td><strong className="text-danger">{formatarMoeda(c.total_em_aberto)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
