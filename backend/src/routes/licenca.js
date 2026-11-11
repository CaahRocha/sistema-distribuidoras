const router = require('express').Router();
const { status, renovar } = require('../controllers/licencaController');

// Rotas de licença não precisam de autenticação
router.get('/status', status);
router.post('/renovar', renovar);

module.exports = router;
