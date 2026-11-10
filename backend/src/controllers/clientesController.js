const db = require('../models/db');

// Listar clientes
const listar = (req, res) => {
  const { busca, ativo } = req.query;

  let query = `
    SELECT c.*,
      COALESCE(SUM(CASE WHEN f.status IN ('aberto', 'parcial') THEN (f.valor_original - f.valor_pago) ELSE 0 END), 0) as total_fiado
    FROM clientes c
    LEFT JOIN fiado f ON c.id = f.cliente_id
    WHERE 1=1
  `;
  const params = [];

  if (busca) {
    query += ' AND (c.nome LIKE ? OR c.telefone LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  if (ativo !== undefined) {
    query += ' AND c.ativo = ?';
    params.push(ativo);
  } else {
    query += ' AND c.ativo = 1';
  }

  query += ' GROUP BY c.id ORDER BY c.nome';

  const clientes = db.prepare(query).all(...params);
  res.json(clientes);
};

// Buscar cliente por ID
const buscarPorId = (req, res) => {
  const cliente = db.prepare(`
    SELECT c.*,
      COALESCE(SUM(CASE WHEN f.status IN ('aberto', 'parcial') THEN (f.valor_original - f.valor_pago) ELSE 0 END), 0) as total_fiado
    FROM clientes c
    LEFT JOIN fiado f ON c.id = f.cliente_id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id);

  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado' });
  }

  res.json(cliente);
};

// Criar cliente
const criar = (req, res) => {
  const { nome, telefone, endereco, limite_fiado } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: 'Nome do cliente é obrigatório' });
  }

  const resultado = db.prepare(`
    INSERT INTO clientes (nome, telefone, endereco, limite_fiado)
    VALUES (?, ?, ?, ?)
  `).run(nome, telefone || null, endereco || null, limite_fiado || 0);

  res.status(201).json({ id: resultado.lastInsertRowid, mensagem: 'Cliente criado com sucesso' });
};

// Editar cliente
const editar = (req, res) => {
  const { id } = req.params;
  const { nome, telefone, endereco, limite_fiado } = req.body;

  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(id);
  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado' });
  }

  db.prepare(`
    UPDATE clientes SET
      nome = COALESCE(?, nome),
      telefone = COALESCE(?, telefone),
      endereco = COALESCE(?, endereco),
      limite_fiado = COALESCE(?, limite_fiado)
    WHERE id = ?
  `).run(nome || null, telefone || null, endereco || null, limite_fiado !== undefined ? limite_fiado : null, id);

  res.json({ mensagem: 'Cliente atualizado com sucesso' });
};

// Desativar cliente
const desativar = (req, res) => {
  const { id } = req.params;

  const cliente = db.prepare('SELECT id FROM clientes WHERE id = ?').get(id);
  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado' });
  }

  // Verificar se tem fiado em aberto
  const fiadoAberto = db.prepare(`
    SELECT id FROM fiado WHERE cliente_id = ? AND status IN ('aberto', 'parcial')
  `).get(id);

  if (fiadoAberto) {
    return res.status(400).json({ erro: 'Cliente possui fiado em aberto. Quite o fiado antes de desativar.' });
  }

  db.prepare('UPDATE clientes SET ativo = 0 WHERE id = ?').run(id);
  res.json({ mensagem: 'Cliente desativado com sucesso' });
};

module.exports = { listar, buscarPorId, criar, editar, desativar };
