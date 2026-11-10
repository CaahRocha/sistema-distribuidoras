const router = require('express').Router();
const { get, salvar, enviarRelatorio } = require('../controllers/configuracoesController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

// Todas as rotas de configurações são apenas para admin
router.use(verificarToken, apenasAdmin);

router.get('/', get);
router.post('/', salvar);
router.post('/enviar-relatorio', enviarRelatorio);

module.exports = router;
