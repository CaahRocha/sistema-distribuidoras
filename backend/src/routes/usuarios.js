const router = require('express').Router();
const { listar, criar, editar, alterarStatus } = require('../controllers/usuariosController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

// Todas as rotas de usuários são apenas para admin
router.use(verificarToken, apenasAdmin);

router.get('/', listar);
router.post('/', criar);
router.put('/:id', editar);
router.patch('/:id/status', alterarStatus);

module.exports = router;
