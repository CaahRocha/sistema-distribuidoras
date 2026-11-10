const router = require('express').Router();
const { listar, buscarPorId, criar, editar, desativar, listarCategorias, criarCategoria } = require('../controllers/produtosController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

router.use(verificarToken);

// Categorias
router.get('/categorias', listarCategorias);
router.post('/categorias', apenasAdmin, criarCategoria);

// Produtos
router.get('/', listar);
router.get('/:id', buscarPorId);
router.post('/', apenasAdmin, criar);
router.put('/:id', apenasAdmin, editar);
router.delete('/:id', apenasAdmin, desativar);

module.exports = router;
