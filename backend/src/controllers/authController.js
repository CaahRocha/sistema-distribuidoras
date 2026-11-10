const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'distribuidoras_secret_2024';

// Login por nome de usuário (login)
const login = (req, res) => {
  const { login: loginField, senha } = req.body;

  if (!loginField || !senha) {
    return res.status(400).json({ erro: 'Usuário e senha são obrigatórios' });
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE login = ? AND ativo = 1').get(loginField);

  if (!usuario) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  }

  const senhaValida = bcrypt.compareSync(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' });
  }

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, login: usuario.login, perfil: usuario.perfil },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil
    }
  });
};

// Dados do usuário logado
const me = (req, res) => {
  const usuario = db.prepare('SELECT id, nome, login, perfil FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!usuario) {
    return res.status(404).json({ erro: 'Usuário não encontrado' });
  }
  res.json(usuario);
};

module.exports = { login, me };
