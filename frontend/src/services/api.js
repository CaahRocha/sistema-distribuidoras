const BASE_URL = '/api';

// Função base para fazer requisições
const request = async (method, url, body = null) => {
  const token = localStorage.getItem('token');

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.erro || 'Erro na requisição');
  }

  return data;
};

// Atalhos
export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  delete: (url) => request('DELETE', url)
};

// ==================== AUTH ====================
export const authService = {
  login: (login, senha) => api.post('/auth/login', { login, senha }),
  me: () => api.get('/auth/me')
};

// ==================== USUÁRIOS ====================
export const usuariosService = {
  listar: () => api.get('/usuarios'),
  criar: (dados) => api.post('/usuarios', dados),
  editar: (id, dados) => api.put(`/usuarios/${id}`, dados),
  alterarStatus: (id) => api.patch(`/usuarios/${id}/status`)
};

// ==================== PRODUTOS ====================
export const produtosService = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/produtos${query ? '?' + query : ''}`);
  },
  buscar: (id) => api.get(`/produtos/${id}`),
  criar: (dados) => api.post('/produtos', dados),
  editar: (id, dados) => api.put(`/produtos/${id}`, dados),
  desativar: (id) => api.delete(`/produtos/${id}`),
  listarCategorias: () => api.get('/produtos/categorias'),
  criarCategoria: (nome) => api.post('/produtos/categorias', { nome })
};

// ==================== CLIENTES ====================
export const clientesService = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/clientes${query ? '?' + query : ''}`);
  },
  buscar: (id) => api.get(`/clientes/${id}`),
  criar: (dados) => api.post('/clientes', dados),
  editar: (id, dados) => api.put(`/clientes/${id}`, dados),
  desativar: (id) => api.delete(`/clientes/${id}`)
};

// ==================== PEDIDOS ====================
export const pedidosService = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/pedidos${query ? '?' + query : ''}`);
  },
  buscar: (id) => api.get(`/pedidos/${id}`),
  criar: (dados) => api.post('/pedidos', dados),
  adicionarItem: (id, dados) => api.post(`/pedidos/${id}/itens`, dados),
  removerItem: (id, itemId) => api.delete(`/pedidos/${id}/itens/${itemId}`),
  fechar: (id, dados) => api.put(`/pedidos/${id}/fechar`, dados),
  cancelar: (id) => api.put(`/pedidos/${id}/cancelar`)
};

// ==================== ESTOQUE ====================
export const estoqueService = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/estoque${query ? '?' + query : ''}`);
  },
  movimentacoes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/estoque/movimentacoes${query ? '?' + query : ''}`);
  },
  entrada: (dados) => api.post('/estoque/entrada', dados),
  ajuste: (dados) => api.post('/estoque/ajuste', dados)
};

// ==================== FINANCEIRO ====================
export const financeiroService = {
  listarFiado: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/financeiro/fiado${query ? '?' + query : ''}`);
  },
  fiadoPorCliente: (clienteId) => api.get(`/financeiro/fiado/cliente/${clienteId}`),
  pagarFiado: (fiadoId, dados) => api.post(`/financeiro/fiado/${fiadoId}/pagar`, dados),
  caixa: (data) => api.get(`/financeiro/caixa${data ? '?data=' + data : ''}`),
  registrarSaida: (dados) => api.post('/financeiro/caixa/saida', dados)
};

// ==================== CONFIGURAÇÕES ====================
export const configuracoesService = {
  get: () => api.get('/configuracoes'),
  salvar: (dados) => api.post('/configuracoes', dados),
  enviarRelatorio: (data) => api.post(`/configuracoes/enviar-relatorio${data ? '?data=' + data : ''}`)
};
export const relatoriosService = {
  dashboard: () => api.get('/relatorios/dashboard'),
  vendas: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/relatorios/vendas${query ? '?' + query : ''}`);
  },
  produtosMaisVendidos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/relatorios/produtos-mais-vendidos${query ? '?' + query : ''}`);
  },
  estoque: () => api.get('/relatorios/estoque'),
  fiado: () => api.get('/relatorios/fiado')
};
