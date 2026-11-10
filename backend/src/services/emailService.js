const nodemailer = require('nodemailer');
const db = require('../models/db');

// Buscar configuração salva no banco
const getConfig = (chave) => {
  const config = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave);
  return config ? config.valor : null;
};

// Criar transporter com as configurações salvas
const criarTransporter = () => {
  const host = getConfig('smtp_host') || 'smtp.gmail.com';
  const port = parseInt(getConfig('smtp_port')) || 587;
  const user = getConfig('smtp_user');
  const pass = getConfig('smtp_pass');

  if (!user || !pass) {
    throw new Error('Configure o email de envio nas Configurações antes de enviar relatório.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
};

// Formatar valor em moeda BR
const fmt = (v) =>
  `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

// Enviar relatório do dia por email
const enviarRelatorioDia = async (data = null) => {
  const dataFiltro = data || new Date().toISOString().split('T')[0];
  const emailDestino = getConfig('email_relatorio');

  if (!emailDestino) {
    throw new Error('Nenhum email de destino configurado. Acesse Configurações → Email de Relatórios.');
  }

  // Resumo de vendas
  const vendas = db.prepare(`
    SELECT
      COUNT(*) as pedidos,
      COALESCE(SUM(total), 0) as total,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN total ELSE 0 END), 0) as dinheiro,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'pix'      THEN total ELSE 0 END), 0) as pix,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'cartao'   THEN total ELSE 0 END), 0) as cartao,
      COALESCE(SUM(CASE WHEN forma_pagamento = 'fiado'    THEN total ELSE 0 END), 0) as fiado_vendas
    FROM pedidos
    WHERE status = 'fechado' AND DATE(created_at) = ?
  `).get(dataFiltro);

  // Caixa do dia
  const caixa = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
      COALESCE(SUM(CASE WHEN tipo = 'saida'   THEN valor ELSE 0 END), 0) as saidas
    FROM caixa WHERE DATE(created_at) = ?
  `).get(dataFiltro);
  const saldo = caixa.entradas - caixa.saidas;

  // Fiado total em aberto
  const fiadoAberto = db.prepare(`
    SELECT COALESCE(SUM(valor_original - valor_pago), 0) as total
    FROM fiado WHERE status IN ('aberto', 'parcial')
  `).get();

  // Top 5 produtos do dia
  const topProdutos = db.prepare(`
    SELECT COALESCE(pr.nome, pi.nome_produto, 'Item avulso') as nome,
      SUM(pi.quantidade) as qtd, SUM(pi.subtotal) as valor
    FROM pedido_itens pi
    JOIN pedidos p ON pi.pedido_id = p.id
    LEFT JOIN produtos pr ON pi.produto_id = pr.id
    WHERE p.status = 'fechado' AND DATE(p.created_at) = ?
    GROUP BY COALESCE(pr.nome, pi.nome_produto)
    ORDER BY valor DESC LIMIT 5
  `).all(dataFiltro);

  const dataFormatada = new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Relatório do Dia</title>
</head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.12);">

  <!-- Cabeçalho -->
  <div style="background:linear-gradient(135deg,#1e2a3a,#1a56db);padding:32px 28px;text-align:center;color:#fff;">
    <div style="font-size:40px;margin-bottom:10px;">🏪</div>
    <h1 style="margin:0;font-size:22px;font-weight:800;">Relatório do Dia</h1>
    <p style="margin:6px 0 0;opacity:.8;font-size:14px;text-transform:capitalize;">${dataFormatada}</p>
  </div>

  <!-- Resumo de vendas -->
  <div style="padding:24px 28px 0;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:1px;">Resumo de Vendas</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:0 8px 0 0;width:50%;">
          <div style="background:#e8f0fe;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:30px;font-weight:800;color:#1a56db;">${vendas.pedidos}</div>
            <div style="font-size:12px;color:#4a5568;margin-top:4px;">Pedidos Fechados</div>
          </div>
        </td>
        <td style="padding:0 0 0 8px;width:50%;">
          <div style="background:#c6f6d5;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#276749;">${fmt(vendas.total)}</div>
            <div style="font-size:12px;color:#4a5568;margin-top:4px;">Total em Vendas</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Formas de pagamento -->
  <div style="padding:20px 28px 0;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:1px;">Por Forma de Pagamento</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 0;color:#4a5568;">💵 Dinheiro</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;">${fmt(vendas.dinheiro)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 0;color:#4a5568;">📲 PIX</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;">${fmt(vendas.pix)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 0;color:#4a5568;">💳 Cartão</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;">${fmt(vendas.cartao)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#4a5568;">📋 Fiado (vendas do dia)</td>
        <td style="padding:10px 0;text-align:right;font-weight:600;color:#e53e3e;">${fmt(vendas.fiado_vendas)}</td>
      </tr>
    </table>
  </div>

  <!-- Caixa do dia -->
  <div style="padding:20px 28px 0;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:1px;">Caixa do Dia</p>
    <div style="background:#f7fafc;border-radius:10px;padding:16px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 0;color:#4a5568;">↑ Entradas</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#38a169;">${fmt(caixa.entradas)}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 0;color:#4a5568;">↓ Saídas</td>
          <td style="padding:8px 0;text-align:right;font-weight:600;color:#e53e3e;">${fmt(caixa.saidas)}</td>
        </tr>
        <tr>
          <td style="padding:10px 0 0;font-weight:700;font-size:15px;">= Saldo</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:800;font-size:18px;color:${saldo >= 0 ? '#38a169' : '#e53e3e'};">${fmt(saldo)}</td>
        </tr>
      </table>
    </div>
  </div>

  ${topProdutos.length > 0 ? `
  <!-- Top produtos -->
  <div style="padding:20px 28px 0;">
    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:1px;">Top Produtos do Dia</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f7fafc;">
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:#718096;font-weight:600;">PRODUTO</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:#718096;font-weight:600;">QTD</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:#718096;font-weight:600;">VALOR</th>
      </tr>
      ${topProdutos.map((p, i) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:9px 10px;">${i + 1}. ${p.nome}</td>
        <td style="padding:9px 10px;text-align:right;color:#718096;">${p.qtd}</td>
        <td style="padding:9px 10px;text-align:right;font-weight:600;">${fmt(p.valor)}</td>
      </tr>`).join('')}
    </table>
  </div>
  ` : ''}

  ${fiadoAberto.total > 0 ? `
  <!-- Fiado total -->
  <div style="padding:20px 28px 0;">
    <div style="background:#fed7d7;border-radius:10px;padding:14px 16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td>
            <div style="font-weight:600;color:#9b2c2c;">📋 Fiado Total em Aberto</div>
            <div style="font-size:12px;color:#9b2c2c;margin-top:2px;">Valor acumulado de todos os clientes</div>
          </td>
          <td style="text-align:right;">
            <div style="font-size:20px;font-weight:800;color:#9b2c2c;">${fmt(fiadoAberto.total)}</div>
          </td>
        </tr>
      </table>
    </div>
  </div>
  ` : ''}

  <!-- Rodapé -->
  <div style="padding:20px 28px;margin-top:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#a0aec0;margin:0;">Enviado automaticamente pelo Sistema Distribuidoras</p>
  </div>

</div>
</body>
</html>`;

  const user = getConfig('smtp_user');
  const transporter = criarTransporter();

  await transporter.sendMail({
    from: `"Sistema Distribuidoras" <${user}>`,
    to: emailDestino,
    subject: `📊 Relatório ${new Date(dataFiltro + 'T12:00:00').toLocaleDateString('pt-BR')} — Distribuidora`,
    html
  });

  return { mensagem: `Relatório enviado com sucesso para ${emailDestino}` };
};

module.exports = { enviarRelatorioDia, getConfig };
