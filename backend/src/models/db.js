const Database = require('better-sqlite3');
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, '../../database/distribuidoras.db');

// Criar conexão com o banco
const db = new Database(dbPath);

// Habilitar chaves estrangeiras
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
