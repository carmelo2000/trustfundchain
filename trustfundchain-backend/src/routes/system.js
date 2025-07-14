// src/routes/system.js
const express = require('express');
const router = express.Router();

// Ruta para obtener información del sistema
router.get('/info', (req, res) => {
    res.json({
        success: true,
        data: {
            networkInfo: 'Testnet',
            status: 'Sistema operativo correctamente'
        }
    });
});

module.exports = router;
