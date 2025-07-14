const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Donations API funcionando',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
