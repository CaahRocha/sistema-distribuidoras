const db = require('../models/db');
const { enviarRelatorioDia } = require('../services/emailService');

// Buscar todas as configurações (sem expor a senha)
const get = (req, res) => {
  const rows = db.prepare('SELECT chave, valor FROM configuracoes').all();
  const config = {};
  rows.forEach(r => { config[r.chave] = r.valor; });
  // Mascarar senha SMTP
  if (config.smtp_pass) config.smtp_pass = '••••••••';
  res.json(config);
};

// Salvar configurações
const salvar = (req, res) => {
  const { email_relatorio, smtp_host, smtp_port, smtp_user, smtp_pass } = req.body;

  const upsert = db.prepare(`
    INSERT INTO configuracoes (chave, valor)
    VALUES (?, ?)
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP
  `);

  if (email_relatorio !== undefined) upsert.run('email_relatorio', email_relatorio);
  if (smtp_host      !== undefined) upsert.run('smtp_host', smtp_host || 'smtp.gmail.com');
  if (smtp_port      !== undefined) upsert.run('smtp_port', smtp_port || '587');
  if (smtp_user      !== undefined) upsert.run('smtp_user', smtp_user);
  // Só atualiza a senha se vier um valor diferente do placeholder
  if (smtp_pass && smtp_pass !== '••••••••') upsert.run('smtp_pass', smtp_pass);

  res.json({ mensagem: 'Configurações salvas com sucesso' });
};

// Enviar relatório do dia (ou de uma data específica)
const enviarRelatorio = async (req, res) => {
  const { data } = req.query;
  try {
    const resultado = await enviarRelatorioDia(data || null);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
};

module.exports = { get, salvar, enviarRelatorio };
