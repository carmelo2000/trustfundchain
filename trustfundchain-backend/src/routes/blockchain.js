const express = require('express');
const router = express.Router();

// GET /api/blockchain/stats - Estadísticas básicas
router.get('/stats', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                network: process.env.STELLAR_NETWORK || 'testnet',
                status: 'active',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/blockchain/network - Info de red
router.get('/network', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                network: process.env.STELLAR_NETWORK || 'testnet',
                horizon: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
                status: 'connected'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
