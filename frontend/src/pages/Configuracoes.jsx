import { useState, useEffect } from 'react';
import { configuracoesService } from '../services/api';

export default function Configuracoes() {
  const [config, setConfig] = useState({
    email_relatorio: '',
    smtp_user: '',
    smtp_pass: '',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587'
  });
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'success'|'error', texto }

  useEffect(() => {
    carregarConfig();
  }, []);

  const carregarConfig = async () => {
    try {
      const data = await configuracoesService.get();
      setConfig(c => ({
        ...c,
        email_relatorio: data.email_relatorio || '',
        smtp_user:       data.smtp_user       || '',
        smtp_pass:       data.smtp_pass       || '',
        smtp_host:       data.smtp_host       || 'smtp.gmail.com',
        smtp_port:       data.smtp_port       || '587'
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      await configuracoesService.salvar(config);
      setMensagem({ tipo: 'success', texto: 'Configurações salvas com sucesso!' });
    } catch (err) {
      setMensagem({ tipo: 'error', texto: err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleEnviarTeste = async () => {
    setEnviando(true);
    setMensagem(null);
    try {
      const r = await configuracoesService.enviarRelatorio();
      setMensagem({ tipo: 'success', texto: r.mensagem });
    } catch (err) {
      setMensagem({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Configurações</h2>
          <p className="page-subtitle">Configurações gerais do sistema</p>
        </div>
      </div>

      <div className="page-content">
        {mensagem && (
          <div className={`alert alert-${mensagem.tipo === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '20px' }}>
            {mensagem.tipo === 'success' ? '✅ ' : '❌ '}{mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Email de destino ── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📧 Relatório por Email</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>
              Informe o email que vai <strong>receber</strong> o relatório de vendas do dia.
              Você pode enviar a qualquer momento pela página Financeiro → Caixa.
            </p>
            <div className="form-group">
              <label className="form-label">Email para receber os relatórios *</label>
              <input
                type="email"
                className="form-control"
                placeholder="exemplo@gmail.com"
                value={config.email_relatorio}
                onChange={e => setConfig({ ...config, email_relatorio: e.target.value })}
              />
            </div>
          </div>

          {/* ── Configurações do email remetente ── */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">⚙️ Configuração do Email Remetente (Gmail)</span>
            </div>

            <div style={{ background: 'var(--info-light)', border: '1px solid #bee3f8', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '18px', fontSize: '13px', color: '#1a365d' }}>
              <strong>ℹ️ Como configurar o Gmail:</strong>
              <ol style={{ margin: '8px 0 0 18px', lineHeight: 2 }}>
                <li>Ative a <strong>verificação em duas etapas</strong> na sua conta Google</li>
                <li>Acesse <strong>Conta Google → Segurança → Senhas de app</strong></li>
                <li>Gere uma senha para "Email" e cole no campo abaixo</li>
              </ol>
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
                style={{ color: 'var(--primary)', marginTop: '6px', display: 'inline-block', fontWeight: 600 }}>
                → Acessar Senhas de App do Google
              </a>
            </div>

            <div className="form-group">
              <label className="form-label">Gmail do remetente *</label>
              <input
                type="email"
                className="form-control"
                placeholder="seugmail@gmail.com"
                value={config.smtp_user}
                onChange={e => setConfig({ ...config, smtp_user: e.target.value })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Esse email vai aparecer como remetente nos relatórios</span>
            </div>

            <div className="form-group">
              <label className="form-label">Senha de aplicativo *</label>
              <input
                type="password"
                className="form-control"
                placeholder={config.smtp_pass === '••••••••' ? 'Senha já configurada (deixe em branco para não alterar)' : 'Cole a senha de app do Google aqui'}
                value={config.smtp_pass === '••••••••' ? '' : config.smtp_pass}
                onChange={e => setConfig({ ...config, smtp_pass: e.target.value })}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Use a senha de aplicativo, não a senha normal da conta Google</span>
            </div>

            <details style={{ marginBottom: '8px' }}>
              <summary style={{ fontSize: '13px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                Configurações avançadas de SMTP
              </summary>
              <div style={{ marginTop: '14px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Servidor SMTP</label>
                    <input
                      className="form-control"
                      value={config.smtp_host}
                      onChange={e => setConfig({ ...config, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Porta</label>
                    <input
                      className="form-control"
                      value={config.smtp_port}
                      onChange={e => setConfig({ ...config, smtp_port: e.target.value })}
                      placeholder="587"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* ── Botões ── */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={salvando}>
              {salvando ? 'Salvando...' : '💾 Salvar Configurações'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleEnviarTeste}
              disabled={enviando}
              title="Envia o relatório do dia atual para o email configurado"
            >
              {enviando ? 'Enviando...' : '📧 Testar — Enviar Relatório de Hoje'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
