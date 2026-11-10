const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'distribuidoras_secret_2024';

// Verificar token JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};

// Verificar se é admin
const apenasAdmin = (req, res, next) => {
  if (req.usuario.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

module.exports = { verificarToken, apenasAdmin };
