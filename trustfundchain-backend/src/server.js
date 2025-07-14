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
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
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

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TRUSTFUNDCHAIN Backend activo',
    timestamp: new Date().toISOString()
  });
});

// WebSocket para tiempo real
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);
  
  socket.on('subscribe_transactions', () => {
    socket.join('transactions');
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});

// Hacer io disponible globalmente
app.set('io', io);

// 🔥 INICIAR SERVIDOR EN PUERTO 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
