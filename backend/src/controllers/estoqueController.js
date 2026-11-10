const db = require('../models/db');

// Listar estoque atual
const listar = (req, res) => {
  const { busca, alerta } = req.query;

  let query = `
    SELECT p.id, p.codigo, p.nome, p.unidade, p.estoque_atual, p.estoque_minimo,
      p.preco_custo, p.preco_venda, c.nome as categoria_nome,
      CASE WHEN p.estoque_atual <= p.estoque_minimo THEN 1 ELSE 0 END as alerta_estoque
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.ativo = 1
  `;
  const params = [];

  if (busca) {
    query += ' AND (p.nome LIKE ? OR p.codigo LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  if (alerta === '1') {
    query += ' AND p.estoque_atual <= p.estoque_minimo';
  }

  query += ' ORDER BY p.nome';

  const estoque = db.prepare(query).all(...params);
  res.json(estoque);
};

// Listar movimentações
const listarMovimentacoes = (req, res) => {
  const { produto_id, tipo, data_inicio, data_fim } = req.query;

  let query = `
    SELECT em.*, p.nome as produto_nome, p.unidade, u.nome as usuario_nome
    FROM estoque_movimentacoes em
    JOIN produtos p ON em.produto_id = p.id
    LEFT JOIN usuarios u ON em.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (produto_id) {
    query += ' AND em.produto_id = ?';
    params.push(produto_id);
  }
  if (tipo) {
    query += ' AND em.tipo = ?';
    params.push(tipo);
  }
  if (data_inicio) {
    query += ' AND DATE(em.created_at) >= ?';
    params.push(data_inicio);
  }
  if (data_fim) {
    query += ' AND DATE(em.created_at) <= ?';
    params.push(data_fim);
  }

  query += ' ORDER BY em.created_at DESC LIMIT 200';

  const movimentacoes = db.prepare(query).all(...params);
  res.json(movimentacoes);
};

// Registrar entrada de estoque
const registrarEntrada = (req, res) => {
  const { produto_id, quantidade, motivo } = req.body;

  if (!produto_id || !quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: 'Produto e quantidade são obrigatórios' });
  }

  const produto = db.prepare('SELECT id FROM produtos WHERE id = ? AND ativo = 1').get(produto_id);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  db.prepare(`
    UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE id = ?
  `).run(quantidade, produto_id);

  db.prepare(`
    INSERT INTO estoque_movimentacoes (produto_id, tipo, quantidade, motivo, usuario_id)
    VALUES (?, 'entrada', ?, ?, ?)
  `).run(produto_id, quantidade, motivo || 'Entrada manual', req.usuario.id);

  res.json({ mensagem: 'Entrada registrada com sucesso' });
};

// Ajustar estoque (admin)
const ajustar = (req, res) => {
  const { produto_id, quantidade_nova, motivo } = req.body;

  if (!produto_id || quantidade_nova === undefined || quantidade_nova < 0) {
    return res.status(400).json({ erro: 'Produto e nova quantidade são obrigatórios' });
  }

  const produto = db.prepare('SELECT id, estoque_atual FROM produtos WHERE id = ? AND ativo = 1').get(produto_id);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  const diferenca = quantidade_nova - produto.estoque_atual;

  db.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ?').run(quantidade_nova, produto_id);

  db.prepare(`
    INSERT INTO estoque_movimentacoes (produto_id, tipo, quantidade, motivo, usuario_id)
    VALUES (?, 'ajuste', ?, ?, ?)
  `).run(produto_id, Math.abs(diferenca), motivo || `Ajuste manual (${diferenca > 0 ? '+' : ''}${diferenca})`, req.usuario.id);

  res.json({ mensagem: 'Estoque ajustado com sucesso' });
};

module.exports = { listar, listarMovimentacoes, registrarEntrada, ajustar };
