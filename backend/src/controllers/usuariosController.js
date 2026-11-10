const db = require('../models/db');
const bcrypt = require('bcryptjs');

// Listar usuários
const listar = (req, res) => {
  const usuarios = db.prepare('SELECT id, nome, login, perfil, ativo, created_at FROM usuarios ORDER BY nome').all();
  res.json(usuarios);
};

// Criar usuário
const criar = (req, res) => {
  const { nome, login, senha, perfil } = req.body;

  if (!nome || !login || !senha || !perfil) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
  }

  if (!['admin', 'caixa'].includes(perfil)) {
    return res.status(400).json({ erro: 'Perfil inválido. Use: admin ou caixa' });
  }

  const loginExiste = db.prepare('SELECT id FROM usuarios WHERE login = ?').get(login);
  if (loginExiste) {
    return res.status(400).json({ erro: 'Esse nome de usuário já está em uso' });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);

  const resultado = db.prepare(`
    INSERT INTO usuarios (nome, login, senha, perfil) VALUES (?, ?, ?, ?)
  `).run(nome, login, senhaHash, perfil);

  res.status(201).json({ id: resultado.lastInsertRowid, mensagem: 'Usuário criado com sucesso' });
};

// Editar usuário
const editar = (req, res) => {
  const { id } = req.params;
  const { nome, login, perfil, senha } = req.body;

  const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(id);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  if (login) {
    const loginExiste = db.prepare('SELECT id FROM usuarios WHERE login = ? AND id != ?').get(login, id);
    if (loginExiste) {
      return res.status(400).json({ erro: 'Esse nome de usuário já está em uso por outro usuário' });
    }
  }

  if (senha) {
    const senhaHash = bcrypt.hashSync(senha, 10);
    db.prepare('UPDATE usuarios SET senha = ? WHERE id = ?').run(senhaHash, id);
  }

  db.prepare(`
    UPDATE usuarios SET
      nome  = COALESCE(?, nome),
      login = COALESCE(?, login),
      perfil = COALESCE(?, perfil)
    WHERE id = ?
  `).run(nome || null, login || null, perfil || null, id);

  res.json({ mensagem: 'Usuário atualizado com sucesso' });
};

// Ativar/desativar usuário
const alterarStatus = (req, res) => {
  const { id } = req.params;

  const usuario = db.prepare('SELECT id, ativo FROM usuarios WHERE id = ?').get(id);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }

  const novoStatus = usuario.ativo === 1 ? 0 : 1;
  db.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?').run(novoStatus, id);

  res.json({ mensagem: novoStatus === 1 ? 'Usuário ativado' : 'Usuário desativado' });
};

module.exports = { listar, criar, editar, alterarStatus };
