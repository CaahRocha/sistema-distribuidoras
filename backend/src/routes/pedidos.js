const router = require('express').Router();
const { listar, buscarPorId, criar, adicionarItem, removerItem, fechar, cancelar } = require('../controllers/pedidosController');
const { verificarToken } = require('../middleware/auth');

router.use(verificarToken);

router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', criar);
router.post('/:id/itens', adicionarItem);
router.delete('/:id/itens/:itemId', removerItem);
router.put('/:id/fechar', fechar);
router.put('/:id/cancelar', cancelar);

module.exports = router;
