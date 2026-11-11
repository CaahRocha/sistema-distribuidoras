const crypto = require('crypto');
const db = require('../models/db');

// ⚠️  CHAVE SECRETA — só você tem acesso a essa chave
// Não compartilhe o código fonte com os clientes
const SECRET = process.env.LICENCA_SECRET || 'dist_caah_luziania_2024_key';

// Gerar código para uma data de vencimento
const gerarCodigo = (dataExpira) => {
  const hash = crypto.createHmac('sha256', SECRET).update(dataExpira).digest('hex');
  return hash.substring(0, 8).toUpperCase();
};

// Status da licença atual
const status = (req, res) => {
  const config = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'licenca_expira'").get();

  if (!config || !config.valor) {
    return res.json({ status: 'sem_licenca', expira: null, dias_restantes: 0 });
  }

  const expiry = new Date(config.valor + 'T23:59:59');
  const hoje = new Date();
  const diasRestantes = Math.ceil((expiry - hoje) / (1000 * 60 * 60 * 24));

  res.json({
    status: diasRestantes > 0 ? 'ativa' : 'expirada',
    expira: config.valor,
    dias_restantes: Math.max(0, diasRestantes)
  });
};

// Renovar licença com código
const renovar = (req, res) => {
  const { codigo, data_expira } = req.body;

  if (!codigo || !data_expira) {
    return res.status(400).json({ erro: 'Código e data são obrigatórios' });
  }

  // Validar formato AAAA-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_expira)) {
    return res.status(400).json({ erro: 'Data inválida. Use o formato AAAA-MM-DD' });
  }

  const codigoEsperado = gerarCodigo(data_expira);

  if (codigo.trim().toUpperCase() !== codigoEsperado) {
    return res.status(400).json({ erro: 'Código inválido. Verifique e tente novamente.' });
  }

  db.prepare(`
    INSERT INTO configuracoes (chave, valor)
    VALUES ('licenca_expira', ?)
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP
  `).run(data_expira);

  const dataFormatada = new Date(data_expira + 'T12:00:00').toLocaleDateString('pt-BR');
  res.json({ mensagem: `✅ Licença renovada com sucesso até ${dataFormatada}!` });
};

module.exports = { status, renovar, gerarCodigo };
