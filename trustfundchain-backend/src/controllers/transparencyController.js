const Identity = require('../models/Identity');

exports.getTransactions = async (req, res) => {
  try {
    console.log('📊 Obteniendo datos de transparencia...');
    
    // Obtener estadísticas de identidades
    const totalIdentities = await Identity.countDocuments();
    const verifiedIdentities = await Identity.countDocuments({ verified: true });
    const realStellarIdentities = await Identity.countDocuments({ isRealStellar: true });
    const recentIdentities = await Identity.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Obtener identidades recientes para mostrar como "transacciones"
    const recentTransactions = await Identity.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name did publicKey network createdAt verified isRealStellar');

    // Simular datos de transacciones basados en las identidades
    const transactions = recentTransactions.map((identity, index) => ({
      id: `tx_${identity._id}`,
      hash: `${identity.publicKey.substring(0, 8)}...${identity.publicKey.substring(-8)}`,
      type: 'Creación de Identidad',
      from: 'Sistema',
      to: identity.name,
      amount: identity.isRealStellar ? '10.0000000' : '0.0000000',
      asset: 'XLM',
      date: identity.createdAt,
      status: identity.verified ? 'Verificada' : 'Pendiente',
      network: identity.network,
      stellarExplorer: identity.isRealStellar 
        ? `https://stellar.expert/explorer/testnet/account/${identity.publicKey}`
        : null,
      description: `Identidad digital creada para ${identity.name}`,
      fee: '0.00001',
      memo: `TrustFundChain Identity: ${identity.name.substring(0, 20)}`
    }));

    // Obtener distribución por tipo de documento
    const documentTypes = await Identity.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Obtener distribución por red
    const networkDistribution = await Identity.aggregate([
      { $group: { _id: '$network', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Calcular estadísticas adicionales
    const verificationRate = totalIdentities > 0 ? (verifiedIdentities / totalIdentities * 100).toFixed(1) : 0;
    const stellarRate = totalIdentities > 0 ? (realStellarIdentities / totalIdentities * 100).toFixed(1) : 0;

    const response = {
      success: true,
      data: {
        // Estadísticas generales
        stats: {
          totalIdentities,
          verifiedIdentities,
          realStellarIdentities,
          recentIdentities,
          verificationRate: parseFloat(verificationRate),
          stellarRate: parseFloat(stellarRate),
          totalTransactions: transactions.length,
          totalVolume: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(7)
        },
        
        // Transacciones recientes
        transactions,
        
        // Distribuciones
        documentTypes: documentTypes.map(dt => ({
          type: dt._id || 'Sin especificar',
          count: dt.count,
          percentage: totalIdentities > 0 ? (dt.count / totalIdentities * 100).toFixed(1) : 0
        })),
        
        networkDistribution: networkDistribution.map(nd => ({
          network: nd._id || 'local',
          count: nd.count,
          percentage: totalIdentities > 0 ? (nd.count / totalIdentities * 100).toFixed(1) : 0
        })),
        
        // Información del sistema
        systemInfo: {
          lastUpdate: new Date().toISOString(),
          blockchain: 'Stellar Testnet',
          version: '1.0.0',
          status: 'Activo'
        }
      },
      message: 'Datos de transparencia obtenidos exitosamente'
    };

    console.log('✅ Datos de transparencia generados:', {
      totalIdentities,
      transactions: transactions.length,
      verificationRate: verificationRate + '%'
    });

    res.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo datos de transparencia:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Error al obtener datos de transparencia'
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalIdentities = await Identity.countDocuments();
    const verifiedIdentities = await Identity.countDocuments({ verified: true });
    const realStellarIdentities = await Identity.countDocuments({ isRealStellar: true });
    
    // Estadísticas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await Identity.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$verified', 1, 0] } },
          stellar: { $sum: { $cond: ['$isRealStellar', 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalIdentities,
          verifiedIdentities,
          realStellarIdentities,
          pendingVerification: totalIdentities - verifiedIdentities
        },
        monthlyGrowth: monthlyStats.map(stat => ({
          period: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
          total: stat.count,
          verified: stat.verified,
          stellar: stat.stellar
        })),
        lastUpdate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Función para simular nuevas transacciones (para demo)
exports.simulateNewTransaction = async () => {
  try {
    // Esta función puede ser llamada periódicamente para simular actividad
    const randomIdentity = await Identity.findOne().sort({ createdAt: -1 });
    
    if (randomIdentity) {
      console.log('🎲 Simulando nueva actividad para:', randomIdentity.name);
      
      // Aquí podrías crear registros de actividad simulada
      return {
        type: 'simulated_activity',
        identity: randomIdentity.name,
        timestamp: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error simulando transacción:', error);
    return null;
  }
};

// Función para obtener transacciones Stellar reales
exports.getRealStellarTransactions = async (req, res) => {
  try {
    const stellarIdentities = await Identity.find({ isRealStellar: true })
      .select('name publicKey network')
      .limit(5);

    if (stellarIdentities.length === 0) {
      return res.json({
        success: true,
        data: {
          transactions: [],
          message: 'No hay identidades Stellar reales aún'
        }
      });
    }

    const stellarService = require('../services/stellarService');
    const allTransactions = [];

    for (const identity of stellarIdentities) {
      try {
        const transactions = await stellarService.getAccountTransactions(identity.publicKey, 5);
        
        const processedTx = transactions.map(tx => ({
          ...tx,
          identityName: identity.name,
          network: identity.network
        }));
        
        allTransactions.push(...processedTx);
      } catch (txError) {
        console.log(`⚠️ No se pudieron obtener transacciones para ${identity.name}:`, txError.message);
      }
    }

    res.json({
      success: true,
      data: {
        transactions: allTransactions.slice(0, 20), // Limitar a 20 transacciones
        totalAccounts: stellarIdentities.length,
        message: 'Transacciones Stellar reales obtenidas'
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo transacciones Stellar reales:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
