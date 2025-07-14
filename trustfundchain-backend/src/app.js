require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/database');

// Importar rutas
const identityRoutes = require('./routes/identity');
const transparencyRoutes = require('./routes/transparency');
const donationRoutes = require('./routes/donations');
const blockchainRoutes = require('./routes/blockchain');

const app = express();
const server = createServer(app);

// Configuración de Socket.IO para tiempo real
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500",
    methods: ["GET", "POST"]
  }
});

// Conectar a MongoDB
connectDB();

// Middleware CORS específico para tu frontend
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'null' // Para archivos locales
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/identity', identityRoutes);
app.use('/api/transparency', transparencyRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'TRUSTFUNDCHAIN API',
    version: '1.0.0',
    status: 'active',
    endpoints: [
      'GET /api/health',
      'POST /api/identity/create',
      'GET /api/identity/:did',
      'GET /api/transparency/transactions',
      'GET /api/transparency/stats',
      'POST /api/transparency/transactions',
      'GET /api/blockchain/stats',
      'GET /api/blockchain/network',
      'POST /api/blockchain/verify/:txHash',
      'POST /api/blockchain/fund'
    ],
    documentation: 'https://docs.trustfundchain.org'
  });
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TRUSTFUNDCHAIN Backend activo',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    network: process.env.STELLAR_NETWORK || 'testnet',
    database: 'connected',
    blockchain: 'monitoring'
  });
});

// Ruta de información del sistema
app.get('/api/system/info', async (req, res) => {
  try {
    const stellarConfig = require('./config/stellar');
    const blockchainService = require('./services/blockchainService');
    
    const networkInfo = await blockchainService.getNetworkInfo();
    const blockchainStats = await blockchainService.getBlockchainStats();
    
    res.json({
      success: true,
      data: {
        network: process.env.STELLAR_NETWORK,
        horizon: process.env.STELLAR_HORIZON_URL,
        soroban: process.env.SOROBAN_RPC_URL,
        contracts: {
          identity: process.env.IDENTITY_CONTRACT_ID || 'not_deployed',
          funding: process.env.FUNDING_CONTRACT_ID || 'not_deployed'
        },
        networkInfo,
        blockchainStats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// WebSocket para tiempo real
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  
  // Suscripción a transacciones
  socket.on('subscribe_transactions', () => {
    socket.join('transactions');
    console.log('📊 Cliente suscrito a transacciones:', socket.id);
  });
  
  // Suscripción a identidades
  socket.on('subscribe_identities', () => {
    socket.join('identities');
    console.log('👤 Cliente suscrito a identidades:', socket.id);
  });
  
  // Suscripción a blockchain
  socket.on('subscribe_blockchain', () => {
    socket.join('blockchain');
    console.log('⛓️  Cliente suscrito a blockchain:', socket.id);
  });
  
  // Enviar estadísticas iniciales
  socket.on('request_stats', async () => {
    try {
      const blockchainService = require('./services/blockchainService');
      const stats = await blockchainService.getBlockchainStats();
      socket.emit('stats_update', stats);
    } catch (error) {
      socket.emit('stats_error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

// Hacer io disponible globalmente
app.set('io', io);

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'GET /api/system/info',
      'POST /api/identity/create',
      'GET /api/transparency/transactions',
      'GET /api/transparency/stats',
      'GET /api/blockchain/stats'
    ]
  });
});

// Middleware de manejo de errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal',
    timestamp: new Date().toISOString()
  });
});

// Inicializar Stellar y monitoreo de blockchain después del inicio
setTimeout(async () => {
  try {
    console.log('🚀 Inicializando conexión Stellar...');
    
    // Verificar que los servicios existan antes de usarlos
    let stellarConfig, blockchainService;
    
    try {
      stellarConfig = require('./config/stellar');
      blockchainService = require('./services/blockchainService');
    } catch (requireError) {
      console.error('❌ Error cargando servicios:', requireError.message);
      console.log('🔄 Continuando sin servicios blockchain...');
      return;
    }
    
    // Inicializar Stellar
    const stellarInitialized = await stellarConfig.initialize();
    
    if (stellarInitialized) {
      console.log('✅ Stellar inicializado correctamente');
      
      // Iniciar monitoreo de blockchain si el servicio existe
      try {
        await blockchainService.startMonitoring(io);
        console.log('✅ Sistema blockchain completamente inicializado');
      } catch (monitorError) {
        console.log('⚠️ Monitoreo no disponible:', monitorError.message);
      }
      
      // Emitir evento de inicialización completa
      io.emit('system_ready', {
        stellar: true,
        blockchain: true,
        timestamp: new Date().toISOString()
      });
      
    } else {
      console.log('⚠️ Stellar no inicializado, usando modo simulado');
      
      // Modo simulado
      io.emit('system_ready', {
        stellar: false,
        blockchain: false,
        simulation: true,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Error inicializando blockchain:', error);
    console.log('🔄 Sistema funcionando en modo básico...');
    
    io.emit('system_ready', {
      stellar: false,
      blockchain: false,
      simulation: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}, 3000);
