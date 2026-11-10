const db = require('../models/db');
const bcrypt = require('bcryptjs');

// Criar todas as tabelas do sistema
const criarTabelas = () => {

  // Tabela de usuários (login em vez de email)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      login TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      perfil TEXT NOT NULL CHECK(perfil IN ('admin', 'caixa')),
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de categorias de produtos
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de produtos
  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      codigo_barras TEXT UNIQUE,
      nome TEXT NOT NULL,
      categoria_id INTEGER,
      unidade TEXT DEFAULT 'UN',
      preco_custo REAL DEFAULT 0,
      preco_venda REAL NOT NULL,
      estoque_atual REAL DEFAULT 0,
      estoque_minimo REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )
  `);

  // Tabela de clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT,
      endereco TEXT,
      limite_fiado REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de pedidos
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      usuario_id INTEGER NOT NULL,
      status TEXT DEFAULT 'aberto' CHECK(status IN ('aberto', 'fechado', 'cancelado')),
      total REAL DEFAULT 0,
      forma_pagamento TEXT CHECK(forma_pagamento IN ('dinheiro', 'pix', 'cartao', 'fiado')),
      observacao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Tabela de itens do pedido
  // produto_id pode ser NULL para itens avulsos (sem produto cadastrado)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedido_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      produto_id INTEGER,
      nome_produto TEXT,
      quantidade REAL NOT NULL,
      preco_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )
  `);

  // Tabela de movimentações de estoque
  db.exec(`
    CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida', 'ajuste')),
      quantidade REAL NOT NULL,
      motivo TEXT,
      usuario_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Tabela de fiado (contas a receber)
  db.exec(`
    CREATE TABLE IF NOT EXISTS fiado (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      pedido_id INTEGER,
      valor_original REAL NOT NULL,
      valor_pago REAL DEFAULT 0,
      status TEXT DEFAULT 'aberto' CHECK(status IN ('aberto', 'pago', 'parcial')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    )
  `);

  // Tabela de pagamentos do fiado
  db.exec(`
    CREATE TABLE IF NOT EXISTS fiado_pagamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiado_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      observacao TEXT,
      usuario_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fiado_id) REFERENCES fiado(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Tabela de caixa
  db.exec(`
    CREATE TABLE IF NOT EXISTS caixa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
      valor REAL NOT NULL,
      descricao TEXT,
      forma_pagamento TEXT,
      pedido_id INTEGER,
      usuario_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  console.log('✅ Tabelas criadas com sucesso!');
};

// Criar usuários padrão se não existirem
const criarUsuariosPadrao = () => {
  const adminExiste = db.prepare('SELECT id FROM usuarios WHERE login = ?').get('admin');
  if (!adminExiste) {
    const senha = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO usuarios (nome, login, senha, perfil) VALUES (?, ?, ?, ?)`).run('Administrador', 'admin', senha, 'admin');
  }

  const caixaExiste = db.prepare('SELECT id FROM usuarios WHERE login = ?').get('caixa');
  if (!caixaExiste) {
    const senha = bcrypt.hashSync('caixa123', 10);
    db.prepare(`INSERT INTO usuarios (nome, login, senha, perfil) VALUES (?, ?, ?, ?)`).run('Caixa', 'caixa', senha, 'caixa');
  }
};

// Criar categorias padrão
const criarCategoriasPadrao = () => {
  const categorias = ['Bebidas Alcoólicas', 'Bebidas Não Alcoólicas', 'Cigarros', 'Tabacos', 'Artigos de Fumo', 'Outros'];
  const inserir = db.prepare('INSERT OR IGNORE INTO categorias (nome) VALUES (?)');
  categorias.forEach(cat => inserir.run(cat));
  console.log('✅ Categorias padrão criadas!');
};

// Inicializar banco
criarTabelas();
criarUsuariosPadrao();
criarCategoriasPadrao();

// Migrações: adicionar colunas novas sem quebrar banco existente
const migracoes = () => {
  try {
    db.exec('ALTER TABLE produtos ADD COLUMN codigo_barras TEXT');
    console.log('✅ Migração: coluna codigo_barras adicionada.');
  } catch (e) { /* coluna já existe */ }

  // Tabela de configurações do sistema
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT UNIQUE NOT NULL,
      valor TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
migracoes();

module.exports = db;
