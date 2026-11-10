const router = require('express').Router();
const { listarFiado, fiadoPorCliente, pagarFiado, caixaDia, registrarSaida } = require('../controllers/financeiroController');
const { verificarToken, apenasAdmin } = require('../middleware/auth');

router.use(verificarToken);

router.get('/fiado', listarFiado);
router.get('/fiado/cliente/:clienteId', fiadoPorCliente);
router.post('/fiado/:fiadoId/pagar', pagarFiado);
router.get('/caixa', caixaDia);
router.post('/caixa/saida', apenasAdmin, registrarSaida);

module.exports = router;
