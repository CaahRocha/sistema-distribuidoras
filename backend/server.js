const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Inicializar banco de dados e criar tabelas
require('./src/database/schema');

// Rotas da API
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/usuarios', require('./src/routes/usuarios'));
app.use('/api/produtos', require('./src/routes/produtos'));
app.use('/api/clientes', require('./src/routes/clientes'));
app.use('/api/pedidos', require('./src/routes/pedidos'));
app.use('/api/estoque', require('./src/routes/estoque'));
app.use('/api/financeiro', require('./src/routes/financeiro'));
app.use('/api/relatorios', require('./src/routes/relatorios'));
app.use('/api/configuracoes', require('./src/routes/configuracoes'));

// Servir o frontend (build do React/Vite)
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Escuta em 0.0.0.0 para acesso na rede local
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('==========================================');
  console.log('  ✅ Sistema Distribuidoras iniciado!');
  console.log(`  🌐 Acesse: http://localhost:${PORT}`);
  console.log('==========================================');
  console.log('');
});
