import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import './Login.css';

export default function Login() {
  const [loginField, setLoginField] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const dados = await authService.login(loginField, senha);
      login(dados.token, dados.usuario);
      navigate('/');
    } catch (err) {
      setErro(err.message || 'Usuário ou senha incorretos');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🏪</div>
          <h1 className="login-title">Sistema Distribuidoras</h1>
          <p className="login-subtitle">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {erro && <div className="alert alert-danger">{erro}</div>}

          <div className="form-group">
            <label className="form-label">Usuário</label>
            <input
              type="text"
              className="form-control"
              placeholder="admin ou caixa"
              value={loginField}
              onChange={e => setLoginField(e.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>admin</strong> → senha: admin123</p>
          <p><strong>caixa</strong> → senha: caixa123</p>
        </div>
      </div>
    </div>
  );
}
