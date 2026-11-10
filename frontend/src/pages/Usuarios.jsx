import { useState, useEffect } from 'react';
import { usuariosService } from '../services/api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: '', login: '', senha: '', perfil: 'caixa' });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const data = await usuariosService.listar();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const abrirModal = (usuario = null) => {
    setUsuarioAtual(usuario);
    setForm(usuario ? {
      nome: usuario.nome,
      login: usuario.login,
      senha: '',
      perfil: usuario.perfil
    } : { nome: '', login: '', senha: '', perfil: 'caixa' });
    setErro('');
    setModalAberto(true);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      const dados = {
        nome: form.nome,
        login: form.login,
        perfil: form.perfil,
        ...(form.senha && { senha: form.senha })
      };

      if (!usuarioAtual && !form.senha) {
        setErro('Senha é obrigatória para novo usuário');
        setSalvando(false);
        return;
      }

      if (usuarioAtual) {
        await usuariosService.editar(usuarioAtual.id, dados);
      } else {
        await usuariosService.criar(dados);
      }

      setModalAberto(false);
      carregarUsuarios();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarStatus = async (usuario) => {
    const acao = usuario.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} o usuário "${usuario.nome}"?`)) return;
    try {
      await usuariosService.alterarStatus(usuario.id);
      carregarUsuarios();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Usuários</h2>
          <p className="page-subtitle">{usuarios.length} usuários cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => abrirModal()}>+ Novo Usuário</button>
      </div>

      <div className="page-content">
        <div className="card">
          {carregando ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Carregando...</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Usuário (login)</th>
                    <th>Perfil</th>
                    <th>Status</th>
                    <th>Cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.nome}</strong></td>
                      <td><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: '4px' }}>{u.login}</code></td>
                      <td>
                        <span className={`badge ${u.perfil === 'admin' ? 'badge-info' : 'badge-gray'}`}>
                          {u.perfil === 'admin' ? '👑 Admin' : '🧾 Caixa'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => abrirModal(u)}>Editar</button>
                          <button
                            className={`btn btn-sm ${u.ativo ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleAlterarStatus(u)}
                          >
                            {u.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{usuarioAtual ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button className="modal-close" onClick={() => setModalAberto(false)}>✕</button>
            </div>
            <form onSubmit={handleSalvar}>
              <div className="modal-body">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <div className="form-group">
                  <label className="form-label">Nome completo *</label>
                  <input className="form-control" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Usuário (login) *</label>
                  <input
                    className="form-control"
                    value={form.login}
                    onChange={e => setForm({ ...form, login: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="Ex: maria, joao"
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Sem espaços ou caracteres especiais</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Perfil *</label>
                  <select className="form-control" value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}>
                    <option value="caixa">Caixa</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Senha {usuarioAtual ? '(deixe em branco para não alterar)' : '*'}
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    value={form.senha}
                    onChange={e => setForm({ ...form, senha: e.target.value })}
                    placeholder={usuarioAtual ? 'Nova senha (opcional)' : 'Mínimo 6 caracteres'}
                    required={!usuarioAtual}
                    minLength={6}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
