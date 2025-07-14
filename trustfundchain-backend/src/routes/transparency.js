const express = require('express');
const router = express.Router();
const transparencyController = require('../controllers/transparencyController');

// GET /api/transparency/transactions - Obtener todas las transacciones/datos
router.get('/transactions', transparencyController.getTransactions);

// GET /api/transparency/stats - Obtener estadísticas
router.get('/stats', transparencyController.getStats);

// GET /api/transparency/stellar - Obtener transacciones Stellar reales
router.get('/stellar', transparencyController.getRealStellarTransactions);

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Transparency API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
