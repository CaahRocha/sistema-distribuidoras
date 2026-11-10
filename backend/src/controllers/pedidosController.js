const db = require('../models/db');

// Listar pedidos
const listar = (req, res) => {
  const { data_inicio, data_fim, status, cliente_id } = req.query;

  let query = `
    SELECT p.*, c.nome as cliente_nome, u.nome as usuario_nome
    FROM pedidos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (data_inicio) { query += ' AND DATE(p.created_at) >= ?'; params.push(data_inicio); }
  if (data_fim)    { query += ' AND DATE(p.created_at) <= ?'; params.push(data_fim); }
  if (status)      { query += ' AND p.status = ?'; params.push(status); }
  if (cliente_id)  { query += ' AND p.cliente_id = ?'; params.push(cliente_id); }

  query += ' ORDER BY p.created_at DESC';

  const pedidos = db.prepare(query).all(...params);
  res.json(pedidos);
};

// Buscar pedido por ID com itens
const buscarPorId = (req, res) => {
  const pedido = db.prepare(`
    SELECT p.*, c.nome as cliente_nome, u.nome as usuario_nome
    FROM pedidos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }

  // LEFT JOIN para incluir itens avulsos (produto_id NULL)
  const itens = db.prepare(`
    SELECT pi.*,
      COALESCE(pr.nome, pi.nome_produto) as produto_nome,
      COALESCE(pr.unidade, 'UN') as unidade,
      pr.codigo
    FROM pedido_itens pi
    LEFT JOIN produtos pr ON pi.produto_id = pr.id
    WHERE pi.pedido_id = ?
  `).all(pedido.id);

  res.json({ ...pedido, itens });
};

// Criar pedido
const criar = (req, res) => {
  const { cliente_id, observacao } = req.body;

  const resultado = db.prepare(`
    INSERT INTO pedidos (cliente_id, usuario_id, observacao)
    VALUES (?, ?, ?)
  `).run(cliente_id || null, req.usuario.id, observacao || null);

  res.status(201).json({ id: resultado.lastInsertRowid, mensagem: 'Pedido criado com sucesso' });
};

// Adicionar item ao pedido (produto cadastrado OU item avulso)
const adicionarItem = (req, res) => {
  const { id } = req.params;
  const { produto_id, quantidade, nome_produto, preco_unitario } = req.body;

  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
  }

  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.status !== 'aberto') return res.status(400).json({ erro: 'Pedido não está aberto' });

  // ——— Item Avulso (sem produto cadastrado) ———
  if (!produto_id) {
    if (!nome_produto || !preco_unitario || preco_unitario <= 0) {
      return res.status(400).json({ erro: 'Para item avulso informe o nome e o preço unitário' });
    }

    const subtotal = quantidade * preco_unitario;
    db.prepare(`
      INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
      VALUES (?, NULL, ?, ?, ?, ?)
    `).run(id, nome_produto, quantidade, preco_unitario, subtotal);

    atualizarTotal(id);
    return res.json({ mensagem: 'Item avulso adicionado' });
  }

  // ——— Produto cadastrado ———
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(produto_id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  if (produto.estoque_atual < quantidade) {
    return res.status(400).json({
      erro: `Estoque insuficiente. Disponível: ${produto.estoque_atual} ${produto.unidade}`
    });
  }

  // Verificar se produto já está no pedido (mescla quantidade)
  const itemExistente = db.prepare(
    'SELECT id, quantidade FROM pedido_itens WHERE pedido_id = ? AND produto_id = ?'
  ).get(id, produto_id);

  if (itemExistente) {
    const novaQtd = itemExistente.quantidade + quantidade;
    db.prepare('UPDATE pedido_itens SET quantidade = ?, subtotal = ? WHERE id = ?')
      .run(novaQtd, novaQtd * produto.preco_venda, itemExistente.id);
  } else {
    const subtotal = quantidade * produto.preco_venda;
    db.prepare(`
      INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, produto_id, produto.nome, quantidade, produto.preco_venda, subtotal);
  }

  atualizarTotal(id);
  res.json({ mensagem: 'Item adicionado com sucesso' });
};

// Remover item do pedido
const removerItem = (req, res) => {
  const { id, itemId } = req.params;

  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
  if (!pedido || pedido.status !== 'aberto') {
    return res.status(400).json({ erro: 'Pedido não encontrado ou não está aberto' });
  }

  db.prepare('DELETE FROM pedido_itens WHERE id = ? AND pedido_id = ?').run(itemId, id);
  atualizarTotal(id);

  res.json({ mensagem: 'Item removido com sucesso' });
};

// Fechar pedido
const fechar = (req, res) => {
  const { id } = req.params;
  const { forma_pagamento, observacao, cliente_id } = req.body;

  if (!forma_pagamento) {
    return res.status(400).json({ erro: 'Forma de pagamento é obrigatória' });
  }

  // Atualizar cliente se informado agora no fechamento
  if (cliente_id) {
    db.prepare('UPDATE pedidos SET cliente_id = ? WHERE id = ?').run(cliente_id, id);
  }

  const pedido = db.prepare(`
    SELECT p.*, c.limite_fiado,
      COALESCE((
        SELECT SUM(valor_original - valor_pago)
        FROM fiado
        WHERE cliente_id = p.cliente_id AND status IN ('aberto', 'parcial')
      ), 0) as fiado_atual
    FROM pedidos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    WHERE p.id = ?
  `).get(id);

  if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
  if (pedido.status !== 'aberto') return res.status(400).json({ erro: 'Pedido não está aberto' });

  const itens = db.prepare('SELECT * FROM pedido_itens WHERE pedido_id = ?').all(id);
  if (itens.length === 0) return res.status(400).json({ erro: 'Pedido sem itens' });

  // Validar fiado
  if (forma_pagamento === 'fiado') {
    if (!pedido.cliente_id) {
      return res.status(400).json({ erro: 'Para fiado é necessário informar o cliente' });
    }
    const novoFiado = pedido.fiado_atual + pedido.total;
    if (pedido.limite_fiado > 0 && novoFiado > pedido.limite_fiado) {
      return res.status(400).json({
        erro: `Limite de fiado excedido. Limite: R$ ${pedido.limite_fiado.toFixed(2)}, Fiado atual: R$ ${pedido.fiado_atual.toFixed(2)}`
      });
    }
  }

  // Transação: fechar pedido, baixar estoque dos produtos cadastrados, registrar caixa
  const fecharTudo = db.transaction(() => {
    db.prepare(`
      UPDATE pedidos SET status = 'fechado', forma_pagamento = ?, observacao = COALESCE(?, observacao)
      WHERE id = ?
    `).run(forma_pagamento, observacao || null, id);

    // Baixa de estoque apenas para itens com produto cadastrado
    itens.forEach(item => {
      if (item.produto_id) {
        db.prepare('UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?')
          .run(item.quantidade, item.produto_id);

        db.prepare(`
          INSERT INTO estoque_movimentacoes (produto_id, tipo, quantidade, motivo, usuario_id)
          VALUES (?, 'saida', ?, ?, ?)
        `).run(item.produto_id, item.quantidade, `Pedido #${id}`, req.usuario.id);
      }
    });

    // Registrar no caixa (exceto fiado)
    if (forma_pagamento !== 'fiado') {
      db.prepare(`
        INSERT INTO caixa (tipo, valor, descricao, forma_pagamento, pedido_id, usuario_id)
        VALUES ('entrada', ?, ?, ?, ?, ?)
      `).run(pedido.total, `Pedido #${id}`, forma_pagamento, id, req.usuario.id);
    }

    // Criar fiado se necessário
    if (forma_pagamento === 'fiado') {
      db.prepare(`
        INSERT INTO fiado (cliente_id, pedido_id, valor_original)
        VALUES (?, ?, ?)
      `).run(pedido.cliente_id, id, pedido.total);
    }
  });

  fecharTudo();
  res.json({ mensagem: 'Pedido fechado com sucesso' });
};

// Cancelar pedido
const cancelar = (req, res) => {
  const { id } = req.params;

  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
  if (!pedido || pedido.status !== 'aberto') {
    return res.status(400).json({ erro: 'Pedido não encontrado ou não está aberto' });
  }

  db.prepare("UPDATE pedidos SET status = 'cancelado' WHERE id = ?").run(id);
  res.json({ mensagem: 'Pedido cancelado com sucesso' });
};

// Atualizar total do pedido
const atualizarTotal = (pedidoId) => {
  const resultado = db.prepare(
    'SELECT COALESCE(SUM(subtotal), 0) as total FROM pedido_itens WHERE pedido_id = ?'
  ).get(pedidoId);
  db.prepare('UPDATE pedidos SET total = ? WHERE id = ?').run(resultado.total, pedidoId);
};

module.exports = { listar, buscarPorId, criar, adicionarItem, removerItem, fechar, cancelar };
