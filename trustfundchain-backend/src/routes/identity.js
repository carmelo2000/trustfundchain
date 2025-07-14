const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');

// GET /api/identity/test - Ruta de prueba (DEBE IR ANTES de las rutas con parámetros)
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Identity API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// GET /api/identity/stats/summary - Estadísticas de identidades (DEBE IR ANTES de /:did)
router.get('/stats/summary', identityController.getIdentityStats);

// POST /api/identity/test-stellar - Ruta de prueba para crear cuenta Stellar
router.post('/test-stellar', async (req, res) => {
    try {
        console.log('🧪 Probando creación de cuenta Stellar...');
        
        const stellarService = require('../services/stellarService');
        await stellarService.initialize();
        
        const account = await stellarService.createIdentityAccount();
        
        console.log('✅ Cuenta de prueba creada:', account.publicKey);
        
        res.json({
            success: true,
            data: {
                publicKey: account.publicKey,
                did: account.did,
                network: account.network,
                stellarExplorer: `https://stellar.expert/explorer/testnet/account/${account.publicKey}`
            },
            message: 'Cuenta Stellar de prueba creada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error en prueba Stellar:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Error creando cuenta Stellar de prueba'
        });
    }
});

// POST /api/identity/create - Crear nueva identidad
router.post('/create', identityController.createIdentity);

// GET /api/identity - Obtener todas las identidades
router.get('/', identityController.getAllIdentities);

// GET /api/identity/:did - Obtener identidad por DID (DEBE IR AL FINAL)
router.get('/:did', identityController.getIdentity);

// PUT /api/identity/:did/verify - Verificar identidad
router.put('/:did/verify', identityController.verifyIdentity);

// POST /api/identity/:did/fund - Enviar fondos a una identidad
router.post('/:did/fund', async (req, res) => {
    try {
        const { did } = req.params;
        const { amount, purpose } = req.body;
        
        // Buscar la identidad
        const Identity = require('../models/Identity');
        const identity = await Identity.findOne({ did });
        
        if (!identity) {
            return res.status(404).json({
                success: false,
                message: 'Identidad no encontrada'
            });
        }
        
        // Enviar fondos usando el servicio blockchain
        const blockchainService = require('../services/blockchainService');
        const result = await blockchainService.createRealFundingTransaction(
            identity.publicKey,
            amount,
            'Economic',
            purpose || 'Funding directo'
        );
        
        res.json({
            success: true,
            data: result,
            message: 'Fondos enviados exitosamente'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/identity/:did/transactions - Obtener transacciones de una identidad
router.get('/:did/transactions', async (req, res) => {
    try {
        const { did } = req.params;
        
        // Buscar la identidad
        const Identity = require('../models/Identity');
        const identity = await Identity.findOne({ did });
        
        if (!identity) {
            return res.status(404).json({
                success: false,
                message: 'Identidad no encontrada'
            });
        }
        
        // Obtener transacciones de Stellar
        const stellarService = require('../services/stellarService');
        const transactions = await stellarService.getAccountTransactions(identity.publicKey, 20);
        
        res.json({
            success: true,
            data: {
                identity: {
                    did: identity.did,
                    name: identity.name,
                    publicKey: identity.publicKey
                },
                transactions,
                stellarExplorer: `https://stellar.expert/explorer/testnet/account/${identity.publicKey}`
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

