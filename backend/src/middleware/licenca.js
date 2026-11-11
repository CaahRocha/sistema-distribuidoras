const db = require('../models/db');

// Verificar se a licença está ativa em todas as rotas da API
const verificarLicenca = (req, res, next) => {
  // Rotas que não precisam de licença ativa
  const rotasLivres = ['/auth/login', '/licenca/renovar', '/licenca/status'];
  if (rotasLivres.some(r => req.path.includes(r))) return next();

  try {
    const config = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'licenca_expira'").get();

    if (!config || !config.valor) {
      return res.status(402).json({ erro: 'licenca_expirada', mensagem: 'Licença não configurada.' });
    }

    const expiry = new Date(config.valor + 'T23:59:59');
    const hoje = new Date();

    if (hoje > expiry) {
      return res.status(402).json({
        erro: 'licenca_expirada',
        mensagem: 'Licença expirada.',
        expirou_em: config.valor
      });
    }

    // Aviso nos headers quando faltam 5 dias ou menos
    const diasRestantes = Math.ceil((expiry - hoje) / (1000 * 60 * 60 * 24));
    if (diasRestantes <= 5) {
      res.setHeader('X-License-Warning', diasRestantes.toString());
    }

    next();
  } catch (err) {
    next(); // Em caso de erro inesperado, deixa passar
  }
};

module.exports = { verificarLicenca };
