const Identity = require('../models/Identity');
const QRCode = require('qrcode');

exports.createIdentity = async (req, res) => {
  console.log('🚀 === INICIO CREACIÓN DE IDENTIDAD ===');
  console.log('📥 Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  try {
    const { nombre, tipoDoc, numeroDoc, bio, location, documentData, profilePhoto, forceRealStellar } = req.body;
    
    // Validación básica
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre es requerido'
      });
    }
    
    console.log('✅ Paso 1: Validación básica pasada');
    
    let stellarAccount = null;
    let isRealStellar = false;
    
    // Intentar crear cuenta Stellar real si se solicita
    if (forceRealStellar) {
      try {
        console.log('🔄 Intentando crear cuenta Stellar REAL...');
        
        const stellarService = require('../services/stellarService');
        await stellarService.initialize();
        stellarAccount = await stellarService.createIdentityAccount();
        isRealStellar = true;
        
        console.log('✅ Cuenta Stellar REAL creada:', stellarAccount.publicKey);
        
      } catch (stellarError) {
        console.log('❌ Error creando cuenta Stellar real:', stellarError.message);
        // Continuar con cuenta local
      }
    }
    
    // Si no se pudo crear cuenta real, crear cuenta local
    if (!stellarAccount) {
      console.log('🔄 Creando cuenta local...');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      stellarAccount = {
        publicKey: `G${randomSuffix}${timestamp.toString().slice(-6)}LOCAL`,
        secretKey: `S${randomSuffix}${timestamp.toString().slice(-6)}LOCAL`,
        did: `did:local:${timestamp}`,
        network: 'local'
      };
      isRealStellar = false;
    }
    
    console.log('✅ Paso 2: Cuenta generada:', {
      publicKey: stellarAccount.publicKey,
      network: stellarAccount.network,
      isReal: isRealStellar
    });
    
    // Crear DID
    const did = stellarAccount.did || `did:${isRealStellar ? 'stellar' : 'local'}:${stellarAccount.publicKey}`;
    
    // Generar QR code
    console.log('🔄 Paso 3: Generando QR code...');
    let qrCodeDataURL = '';
    
    try {
      const qrData = {
        did,
        name: nombre,
        publicKey: stellarAccount.publicKey,
        network: stellarAccount.network || (isRealStellar ? 'testnet' : 'local'),
        issuer: 'TRUSTFUNDCHAIN',
        created: new Date().toISOString(),
        type: 'identity'
      };
      
      console.log('📋 Datos para QR:', qrData);
      
      qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('✅ QR generado exitosamente, longitud:', qrCodeDataURL.length);
      
    } catch (qrError) {
      console.error('❌ Error generando QR:', qrError);
      // Crear QR simple como fallback
      try {
        qrCodeDataURL = await QRCode.toDataURL(did);
        console.log('✅ QR simple generado como fallback');
      } catch (fallbackError) {
        console.error('❌ Error en QR fallback:', fallbackError);
        qrCodeDataURL = ''; // Continuar sin QR
      }
    }
    
    // Preparar datos para la base de datos
    const identityData = {
      did,
      publicKey: stellarAccount.publicKey,
      secretKey: stellarAccount.secretKey,
      name: nombre,
      documentType: tipoDoc || 'ninguno',
      documentNumber: numeroDoc || '',
      bio: bio || '',
      location: location || '',
      qrCode: qrCodeDataURL,
      profilePhoto: profilePhoto || '',
      verified: false,
      network: stellarAccount.network || (isRealStellar ? 'testnet' : 'local'),
      isRealStellar: isRealStellar
    };
    
    console.log('✅ Paso 4: Datos preparados para BD');
    
    // Guardar en base de datos
    console.log('🔄 Paso 5: Guardando en MongoDB...');
    const identity = new Identity(identityData);
    await identity.save();
    
    console.log('✅ Paso 6: Guardado exitoso con ID:', identity._id);
    
    // Respuesta
    const response = {
      success: true,
      data: {
        did,
        publicKey: stellarAccount.publicKey,
        secretKey: stellarAccount.secretKey,
        qrCode: qrCodeDataURL,
        network: stellarAccount.network || (isRealStellar ? 'testnet' : 'local'),
        isRealStellar,
        hasQR: qrCodeDataURL.length > 0,
        stellarExplorer: isRealStellar ? `https://stellar.expert/explorer/testnet/account/${stellarAccount.publicKey}` : null,
        message: isRealStellar 
          ? '🚀 Identidad creada con cuenta Stellar REAL'
          : '📱 Identidad creada en modo local'
      }
    };
    
    console.log('✅ Paso 7: Enviando respuesta exitosa');
    res.status(201).json(response);
    
    // Emitir evento WebSocket
    try {
      if (req.app.get('io')) {
        req.app.get('io').emit('new_identity', {
          name: nombre,
          did,
          publicKey: stellarAccount.publicKey,
          network: stellarAccount.network || (isRealStellar ? 'testnet' : 'local'),
          isRealStellar,
          timestamp: new Date().toISOString()
        });
      }
    } catch (ioError) {
      console.log('⚠️ Error emitiendo evento WebSocket:', ioError.message);
    }
    
    console.log('🎯 === FIN CREACIÓN EXITOSA ===');
    
  } catch (error) {
    console.log('❌ === ERROR EN CREACIÓN DE IDENTIDAD ===');
    console.error('💥 Error completo:', error);
    console.error('📍 Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString()
    });
  }
};

// Función de prueba mejorada para Stellar
exports.testStellar = async (req, res) => {
  console.log('🧪 === PRUEBA STELLAR ===');
  
  try {
    // Verificar si los servicios están disponibles
    let stellarService;
    try {
      stellarService = require('../services/stellarService');
    } catch (requireError) {
      console.log('❌ No se pudo cargar stellarService:', requireError.message);
      return res.status(500).json({
        success: false,
        error: 'Servicio Stellar no disponible',
        details: requireError.message
      });
    }
    
    // Intentar inicializar
    console.log('🔄 Inicializando servicio Stellar...');
    await stellarService.initialize();
    
    // Crear cuenta de prueba
    console.log('🔄 Creando cuenta de prueba...');
    const account = await stellarService.createIdentityAccount();
    
    console.log('✅ Cuenta de prueba creada exitosamente:', account.publicKey);
    
    res.json({
      success: true,
      data: {
        publicKey: account.publicKey,
        did: account.did,
        network: account.network,
        stellarExplorer: `https://stellar.expert/explorer/testnet/account/${account.publicKey}`
      },
      message: '🚀 Cuenta Stellar de prueba creada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error en prueba Stellar:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Error creando cuenta Stellar de prueba',
      suggestion: 'Verifica la conexión a internet y la configuración de Stellar'
    });
  }
};

// Resto de funciones...
exports.getIdentity = async (req, res) => {
  try {
    const { did } = req.params;
    const identity = await Identity.findOne({ did }).select('-secretKey');
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identidad no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: identity
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getAllIdentities = async (req, res) => {
  try {
    const identities = await Identity.find({})
      .select('-secretKey')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: identities,
      total: identities.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getIdentityStats = async (req, res) => {
  try {
    const total = await Identity.countDocuments();
    const verified = await Identity.countDocuments({ verified: true });
    const realStellar = await Identity.countDocuments({ isRealStellar: true });
    
    res.json({
      success: true,
      data: {
        total,
        verified,
        realStellar,
        recent24h: 0,
        verificationRate: total > 0 ? (verified / total * 100).toFixed(1) : 0,
        stellarRate: total > 0 ? (realStellar / total * 100).toFixed(1) : 0,
        documentTypes: []
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.verifyIdentity = async (req, res) => {
  try {
    const { did } = req.params;
    
    const identity = await Identity.findOneAndUpdate(
      { did },
      { verified: true, verifiedAt: new Date() },
      { new: true }
    );
    
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: 'Identidad no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Identidad verificada',
      data: identity
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
