const db = require('../models/db');

// Relatório de vendas por período
const vendas = (req, res) => {
  const { data_inicio, data_fim } = req.query;

  const inicio = data_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const fim = data_fim || new Date().toISOString().split('T')[0];

  const resumo = db.prepare(`
    SELECT
      COUNT(*) as total_pedidos,
      COALESCE(SUM(total), 0) as total_vendas,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as total_dinheiro,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'pix' THEN total ELSE 0 END), 0) as total_pix,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao' THEN total ELSE 0 END), 0) as total_cartao,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'fiado' THEN total ELSE 0 END), 0) as total_fiado
    FROM pedidos
    WHERE status = 'fechado'
      AND DATE(created_at) BETWEEN ? AND ?
  `).get(inicio, fim);

  const porDia = db.prepare(`
    SELECT DATE(created_at) as data, COUNT(*) as pedidos, SUM(total) as total
    FROM pedidos
    WHERE status = 'fechado'
      AND DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY data
  `).all(inicio, fim);

  res.json({ periodo: { inicio, fim }, resumo, por_dia: porDia });
};

// Produtos mais vendidos
const produtosMaisVendidos = (req, res) => {
  const { data_inicio, data_fim, limite } = req.query;

  const inicio = data_inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const fim = data_fim || new Date().toISOString().split('T')[0];
  const lim = parseInt(limite) || 10;

  const produtos = db.prepare(`
    SELECT
      pr.id, pr.nome, pr.codigo, pr.unidade, c.nome as categoria,
      SUM(pi.quantidade) as total_vendido,
      SUM(pi.subtotal) as total_valor,
      COUNT(DISTINCT pi.pedido_id) as qtd_pedidos
    FROM pedido_itens pi
    JOIN pedidos p ON pi.pedido_id = p.id
    JOIN produtos pr ON pi.produto_id = pr.id
    LEFT JOIN categorias c ON pr.categoria_id = c.id
    WHERE p.status = 'fechado'
      AND DATE(p.created_at) BETWEEN ? AND ?
    GROUP BY pr.id
    ORDER BY total_vendido DESC
    LIMIT ?
  `).all(inicio, fim, lim);

  res.json({ periodo: { inicio, fim }, produtos });
};

// Relatório de estoque
const estoque = (req, res) => {
  const produtos = db.prepare(`
    SELECT p.id, p.codigo, p.nome, p.unidade, p.estoque_atual, p.estoque_minimo,
      p.preco_custo, p.preco_venda, c.nome as categoria,
      (p.estoque_atual * p.preco_custo) as valor_custo,
      (p.estoque_atual * p.preco_venda) as valor_venda,
      CASE WHEN p.estoque_atual <= p.estoque_minimo THEN 1 ELSE 0 END as alerta
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.ativo = 1
    ORDER BY p.nome
  `).all();

  const totais = db.prepare(`
    SELECT
      COUNT(*) as total_produtos,
      SUM(estoque_atual * preco_custo) as valor_total_custo,
      SUM(estoque_atual * preco_venda) as valor_total_venda,
      SUM(CASE WHEN estoque_atual <= estoque_minimo THEN 1 ELSE 0 END) as alertas
    FROM produtos
    WHERE ativo = 1
  `).get();

  res.json({ produtos, totais });
};

// Relatório de fiado (contas a receber)
const fiadoRelatorio = (req, res) => {
  const clientes = db.prepare(`
    SELECT
      c.id, c.nome, c.telefone,
      COUNT(f.id) as qtd_fiados,
      SUM(f.valor_original) as total_original,
      SUM(f.valor_pago) as total_pago,
      SUM(f.valor_original - f.valor_pago) as total_em_aberto
    FROM clientes c
    JOIN fiado f ON c.id = f.cliente_id
    WHERE f.status IN ('aberto', 'parcial')
    GROUP BY c.id
    ORDER BY total_em_aberto DESC
  `).all();

  const total = db.prepare(`
    SELECT COALESCE(SUM(valor_original - valor_pago), 0) as total_a_receber
    FROM fiado
    WHERE status IN ('aberto', 'parcial')
  `).get();

  res.json({ clientes, total_a_receber: total.total_a_receber });
};

// Dashboard - resumo geral
const dashboard = (req, res) => {
  const hoje = new Date().toISOString().split('T')[0];
  const mesInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const vendasHoje = db.prepare(`
    SELECT COUNT(*) as pedidos, COALESCE(SUM(total), 0) as total
    FROM pedidos WHERE status = 'fechado' AND DATE(created_at) = ?
  `).get(hoje);

  const vendasMes = db.prepare(`
    SELECT COUNT(*) as pedidos, COALESCE(SUM(total), 0) as total
    FROM pedidos WHERE status = 'fechado' AND DATE(created_at) >= ?
  `).get(mesInicio);

  const caixaHoje = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
      COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas
    FROM caixa WHERE DATE(created_at) = ?
  `).get(hoje);

  const alertasEstoque = db.prepare(`
    SELECT COUNT(*) as total FROM produtos
    WHERE ativo = 1 AND estoque_atual <= estoque_minimo AND estoque_minimo > 0
  `).get();

  const totalFiado = db.prepare(`
    SELECT COALESCE(SUM(valor_original - valor_pago), 0) as total
    FROM fiado WHERE status IN ('aberto', 'parcial')
  `).get();

  const pedidosAbertos = db.prepare(`
    SELECT COUNT(*) as total FROM pedidos WHERE status = 'aberto'
  `).get();

  res.json({
    vendas_hoje: vendasHoje,
    vendas_mes: vendasMes,
    caixa_hoje: {
      entradas: caixaHoje.entradas,
      saidas: caixaHoje.saidas,
      saldo: caixaHoje.entradas - caixaHoje.saidas
    },
    alertas_estoque: alertasEstoque.total,
    total_fiado: totalFiado.total,
    pedidos_abertos: pedidosAbertos.total
  });
};

module.exports = { vendas, produtosMaisVendidos, estoque, fiadoRelatorio, dashboard };
