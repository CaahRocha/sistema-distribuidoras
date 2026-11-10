const db = require('../models/db');

// Listar todos os fiados
const listarFiado = (req, res) => {
  const { status, cliente_id } = req.query;

  let query = `
    SELECT f.*, c.nome as cliente_nome, p.total as pedido_total
    FROM fiado f
    JOIN clientes c ON f.cliente_id = c.id
    LEFT JOIN pedidos p ON f.pedido_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND f.status = ?';
    params.push(status);
  }
  if (cliente_id) {
    query += ' AND f.cliente_id = ?';
    params.push(cliente_id);
  }

  query += ' ORDER BY f.created_at DESC';

  const fiados = db.prepare(query).all(...params);
  res.json(fiados);
};

// Listar fiado por cliente
const fiadoPorCliente = (req, res) => {
  const { clienteId } = req.params;

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado' });
  }

  const fiados = db.prepare(`
    SELECT f.*, p.total as pedido_total, p.created_at as data_pedido
    FROM fiado f
    LEFT JOIN pedidos p ON f.pedido_id = p.id
    WHERE f.cliente_id = ?
    ORDER BY f.created_at DESC
  `).all(clienteId);

  const totalEmAberto = fiados
    .filter(f => f.status !== 'pago')
    .reduce((acc, f) => acc + (f.valor_original - f.valor_pago), 0);

  res.json({ cliente, fiados, total_em_aberto: totalEmAberto });
};

// Registrar pagamento de fiado
const pagarFiado = (req, res) => {
  const { fiadoId } = req.params;
  const { valor, observacao } = req.body;

  if (!valor || valor <= 0) {
    return res.status(400).json({ erro: 'Valor do pagamento é obrigatório' });
  }

  const fiado = db.prepare('SELECT * FROM fiado WHERE id = ?').get(fiadoId);
  if (!fiado) {
    return res.status(404).json({ erro: 'Fiado não encontrado' });
  }
  if (fiado.status === 'pago') {
    return res.status(400).json({ erro: 'Este fiado já está pago' });
  }

  const valorRestante = fiado.valor_original - fiado.valor_pago;
  if (valor > valorRestante) {
    return res.status(400).json({ erro: `Valor maior que o devido. Valor restante: R$ ${valorRestante.toFixed(2)}` });
  }

  const novoPago = fiado.valor_pago + valor;
  const novoStatus = novoPago >= fiado.valor_original ? 'pago' : 'parcial';

  const pagar = db.transaction(() => {
    db.prepare('UPDATE fiado SET valor_pago = ?, status = ? WHERE id = ?')
      .run(novoPago, novoStatus, fiadoId);

    db.prepare(`
      INSERT INTO fiado_pagamentos (fiado_id, valor, observacao, usuario_id)
      VALUES (?, ?, ?, ?)
    `).run(fiadoId, valor, observacao || null, req.usuario.id);

    // Registrar no caixa
    db.prepare(`
      INSERT INTO caixa (tipo, valor, descricao, forma_pagamento, usuario_id)
      VALUES ('entrada', ?, ?, 'dinheiro', ?)
    `).run(valor, `Pagamento de fiado - ${fiado.id}`, req.usuario.id);
  });

  pagar();
  res.json({ mensagem: 'Pagamento registrado com sucesso', status: novoStatus });
};

// Caixa do dia
const caixaDia = (req, res) => {
  const { data } = req.query;
  const dataFiltro = data || new Date().toISOString().split('T')[0];

  const movimentacoes = db.prepare(`
    SELECT cx.*, u.nome as usuario_nome
    FROM caixa cx
    LEFT JOIN usuarios u ON cx.usuario_id = u.id
    WHERE DATE(cx.created_at) = ?
    ORDER BY cx.created_at DESC
  `).all(dataFiltro);

  const resumo = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entradas,
      COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas
    FROM caixa
    WHERE DATE(created_at) = ?
  `).get(dataFiltro);

  res.json({
    data: dataFiltro,
    movimentacoes,
    total_entradas: resumo.total_entradas,
    total_saidas: resumo.total_saidas,
    saldo: resumo.total_entradas - resumo.total_saidas
  });
};

// Registrar saída no caixa
const registrarSaida = (req, res) => {
  const { valor, descricao } = req.body;

  if (!valor || valor <= 0 || !descricao) {
    return res.status(400).json({ erro: 'Valor e descrição são obrigatórios' });
  }

  db.prepare(`
    INSERT INTO caixa (tipo, valor, descricao, usuario_id)
    VALUES ('saida', ?, ?, ?)
  `).run(valor, descricao, req.usuario.id);

  res.json({ mensagem: 'Saída registrada com sucesso' });
};

module.exports = { listarFiado, fiadoPorCliente, pagarFiado, caixaDia, registrarSaida };
