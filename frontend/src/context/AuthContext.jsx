import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verificar token salvo ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');

    if (token && usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
    setCarregando(false);
  }, []);

  const login = (token, dadosUsuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(dadosUsuario));
    setUsuario(dadosUsuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const isAdmin = () => usuario?.perfil === 'admin';

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAdmin, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
