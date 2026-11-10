const db = require('../models/db');

// Listar produtos
const listar = (req, res) => {
  const { busca, categoria_id, ativo } = req.query;

  let query = `
    SELECT p.*, c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (busca) {
    query += ' AND (p.nome LIKE ? OR p.codigo LIKE ? OR p.codigo_barras LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
  }

  if (categoria_id) {
    query += ' AND p.categoria_id = ?';
    params.push(categoria_id);
  }

  if (ativo !== undefined) {
    query += ' AND p.ativo = ?';
    params.push(ativo);
  } else {
    query += ' AND p.ativo = 1';
  }

  query += ' ORDER BY p.nome';

  const produtos = db.prepare(query).all(...params);
  res.json(produtos);
};

// Buscar produto por ID
const buscarPorId = (req, res) => {
  const produto = db.prepare(`
    SELECT p.*, c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  res.json(produto);
};

// Criar produto
const criar = (req, res) => {
  const { codigo, codigo_barras, nome, categoria_id, unidade, preco_custo, preco_venda, estoque_atual, estoque_minimo } = req.body;

  if (!nome || !preco_venda) {
    return res.status(400).json({ erro: 'Nome e preço de venda são obrigatórios' });
  }

  if (codigo) {
    const codigoExiste = db.prepare('SELECT id FROM produtos WHERE codigo = ?').get(codigo);
    if (codigoExiste) return res.status(400).json({ erro: 'Código já cadastrado' });
  }

  if (codigo_barras) {
    const cbExiste = db.prepare('SELECT id FROM produtos WHERE codigo_barras = ?').get(codigo_barras);
    if (cbExiste) return res.status(400).json({ erro: 'Código de barras já cadastrado' });
  }

  const resultado = db.prepare(`
    INSERT INTO produtos (codigo, codigo_barras, nome, categoria_id, unidade, preco_custo, preco_venda, estoque_atual, estoque_minimo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    codigo || null,
    codigo_barras || null,
    nome,
    categoria_id || null,
    unidade || 'UN',
    preco_custo || 0,
    preco_venda,
    estoque_atual || 0,
    estoque_minimo || 0
  );

  // Registrar movimentação inicial se estoque > 0
  if (estoque_atual && estoque_atual > 0) {
    db.prepare(`
      INSERT INTO estoque_movimentacoes (produto_id, tipo, quantidade, motivo, usuario_id)
      VALUES (?, 'entrada', ?, 'Estoque inicial', ?)
    `).run(resultado.lastInsertRowid, estoque_atual, req.usuario.id);
  }

  res.status(201).json({ id: resultado.lastInsertRowid, mensagem: 'Produto criado com sucesso' });
};

// Editar produto
const editar = (req, res) => {
  const { id } = req.params;
  const { codigo, codigo_barras, nome, categoria_id, unidade, preco_custo, preco_venda, estoque_minimo } = req.body;

  const produto = db.prepare('SELECT id FROM produtos WHERE id = ?').get(id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  if (codigo) {
    const codigoExiste = db.prepare('SELECT id FROM produtos WHERE codigo = ? AND id != ?').get(codigo, id);
    if (codigoExiste) return res.status(400).json({ erro: 'Código já cadastrado por outro produto' });
  }

  if (codigo_barras) {
    const cbExiste = db.prepare('SELECT id FROM produtos WHERE codigo_barras = ? AND id != ?').get(codigo_barras, id);
    if (cbExiste) return res.status(400).json({ erro: 'Código de barras já cadastrado por outro produto' });
  }

  db.prepare(`
    UPDATE produtos SET
      codigo         = COALESCE(?, codigo),
      codigo_barras  = COALESCE(?, codigo_barras),
      nome           = COALESCE(?, nome),
      categoria_id   = COALESCE(?, categoria_id),
      unidade        = COALESCE(?, unidade),
      preco_custo    = COALESCE(?, preco_custo),
      preco_venda    = COALESCE(?, preco_venda),
      estoque_minimo = COALESCE(?, estoque_minimo)
    WHERE id = ?
  `).run(
    codigo || null, codigo_barras || null, nome || null, categoria_id || null,
    unidade || null, preco_custo !== undefined ? preco_custo : null,
    preco_venda || null, estoque_minimo !== undefined ? estoque_minimo : null,
    id
  );

  res.json({ mensagem: 'Produto atualizado com sucesso' });
};

// Desativar produto
const desativar = (req, res) => {
  const { id } = req.params;
  const produto = db.prepare('SELECT id FROM produtos WHERE id = ?').get(id);
  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado' });
  }

  db.prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(id);
  res.json({ mensagem: 'Produto desativado com sucesso' });
};

// Listar categorias
const listarCategorias = (req, res) => {
  const categorias = db.prepare('SELECT * FROM categorias ORDER BY nome').all();
  res.json(categorias);
};

// Criar categoria
const criarCategoria = (req, res) => {
  const { nome } = req.body;
  if (!nome) {
    return res.status(400).json({ erro: 'Nome da categoria é obrigatório' });
  }

  const existe = db.prepare('SELECT id FROM categorias WHERE nome = ?').get(nome);
  if (existe) {
    return res.status(400).json({ erro: 'Categoria já existe' });
  }

  const resultado = db.prepare('INSERT INTO categorias (nome) VALUES (?)').run(nome);
  res.status(201).json({ id: resultado.lastInsertRowid, mensagem: 'Categoria criada com sucesso' });
};

module.exports = { listar, buscarPorId, criar, editar, desativar, listarCategorias, criarCategoria };
