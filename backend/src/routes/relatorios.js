const router = require('express').Router();
const { vendas, produtosMaisVendidos, estoque, fiadoRelatorio, dashboard } = require('../controllers/relatoriosController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

router.use(verificarToken);

// Dashboard disponível para todos
router.get('/dashboard', dashboard);

// Demais relatórios apenas para admin
router.get('/vendas', apenasAdmin, vendas);
router.get('/produtos-mais-vendidos', apenasAdmin, produtosMaisVendidos);
router.get('/estoque', apenasAdmin, estoque);
router.get('/fiado', apenasAdmin, fiadoRelatorio);

module.exports = router;
