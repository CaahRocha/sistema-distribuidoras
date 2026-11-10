const router = require('express').Router();
const { listar, listarMovimentacoes, registrarEntrada, ajustar } = require('../controllers/estoqueController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', listar);
router.get('/movimentacoes', listarMovimentacoes);
router.post('/entrada', registrarEntrada);
router.post('/ajuste', apenasAdmin, ajustar);

module.exports = router;
