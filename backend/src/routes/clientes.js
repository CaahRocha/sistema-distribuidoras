const router = require('express').Router();
const { listar, buscarPorId, criar, editar, desativar } = require('../controllers/clientesController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.put('/:id', editar);
router.delete('/:id', apenasAdmin, desativar);

module.exports = router;
