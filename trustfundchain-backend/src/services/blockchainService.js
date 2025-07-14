const StellarSdk = require('stellar-sdk');
const stellarConfig = require('../config/stellar');
const stellarService = require('./stellarService');
const sorobanService = require('./sorobanService');
const Transaction = require('../models/Transaction');
const Identity = require('../models/Identity');

class BlockchainService {
    constructor() {
        this.server = stellarConfig.getServer();
        this.networkPassphrase = stellarConfig.getNetworkPassphrase();
        this.isMonitoring = false;
        this.lastProcessedLedger = null;
        this.io = null;
    }

    // Iniciar monitoreo de blockchain
    async startMonitoring(socketIO) {
        if (this.isMonitoring) {
            console.log('⚠️  Monitoreo ya está activo');
            return;
        }

        this.io = socketIO;
        this.isMonitoring = true;

        console.log('🔍 Iniciando monitoreo de blockchain...');

        try {
            // Obtener último ledger procesado
            await this.initializeLastLedger();
            
            // Monitorear nuevos ledgers
            this.monitorNewLedgers();
            
            // Monitorear cuentas específicas
            this.monitorTrustFundAccounts();
            
            // Sincronizar transacciones existentes
            this.syncExistingTransactions();
            
            console.log('✅ Monitoreo de blockchain iniciado');

        } catch (error) {
            console.error('❌ Error iniciando monitoreo:', error);
            this.isMonitoring = false;
        }
    }

    // Inicializar último ledger procesado
    async initializeLastLedger() {
        try {
            const latestLedger = await this.server.ledgers().order('desc').limit(1).call();
            this.lastProcessedLedger = parseInt(latestLedger.records[0].sequence);
            console.log('📊 Último ledger:', this.lastProcessedLedger);
        } catch (error) {
            console.error('❌ Error obteniendo último ledger:', error);
            this.lastProcessedLedger = null;
        }
    }

    // Monitorear nuevos ledgers
    monitorNewLedgers() {
        const ledgerStream = this.server
            .ledgers()
            .cursor('now')
            .stream({
                onmessage: (ledger) => {
                    this.processNewLedger(ledger);
                },
                onerror: (error) => {
                    console.error('❌ Error en stream de ledgers:', error);
                    // Reintentar después de 5 segundos
                    setTimeout(() => {
                        this.monitorNewLedgers();
                    }, 5000);
                }
            });

        console.log('🔄 Stream de ledgers iniciado');
        return ledgerStream;
    }

    // Procesar nuevo ledger
    async processNewLedger(ledger) {
        try {
            console.log(`📦 Nuevo ledger: ${ledger.sequence}`);
            
            // Obtener transacciones del ledger
            const transactions = await this.server
                .transactions()
                .forLedger(ledger.sequence)
                .call();

            for (const tx of transactions.records) {
                await this.processTransaction(tx, ledger);
            }

            this.lastProcessedLedger = parseInt(ledger.sequence);

        } catch (error) {
            console.error('❌ Error procesando ledger:', error);
        }
    }

    // Procesar transacción individual
    async processTransaction(stellarTx, ledger) {
        try {
            // Verificar si es una transacción relevante para TrustFundChain
            const isRelevant = await this.isRelevantTransaction(stellarTx);
            if (!isRelevant) return;

            console.log('💫 Procesando transacción relevante:', stellarTx.hash);

            // Obtener operaciones de la transacción
            const operations = await stellarTx.operations();

            for (const op of operations.records) {
                if (op.type === 'payment') {
                    await this.processPaymentOperation(stellarTx, op, ledger);
                } else if (op.type === 'invoke_contract') {
                    await this.processContractOperation(stellarTx, op, ledger);
                }
            }

        } catch (error) {
            console.error('❌ Error procesando transacción:', error);
        }
    }

    // Verificar si la transacción es relevante
    async isRelevantTransaction(stellarTx) {
        try {
            // Verificar si involucra cuentas de identidades registradas
            const identities = await Identity.find({}, 'publicKey');
            const identityKeys = identities.map(id => id.publicKey);

            // Verificar cuenta maestra
            const masterKey = stellarConfig.getMasterKeypair()?.publicKey();
            if (masterKey) identityKeys.push(masterKey);

            // Verificar si la transacción involucra alguna de nuestras cuentas
            const operations = await stellarTx.operations();
            
            for (const op of operations.records) {
                if (op.type === 'payment') {
                    if (identityKeys.includes(op.from) || identityKeys.includes(op.to)) {
                        return true;
                    }
                }
            }

            // Verificar memo para TrustFundChain
            if (stellarTx.memo && stellarTx.memo.includes('TrustFund')) {
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Error verificando relevancia:', error);
            return false;
        }
    }

    // Procesar operación de pago
    async processPaymentOperation(stellarTx, operation, ledger) {
        try {
            console.log('💸 Procesando pago:', {
                from: operation.from,
                to: operation.to,
                amount: operation.amount
            });

            // Verificar si ya existe la transacción
            let existingTx = await Transaction.findOne({ stellarTxHash: stellarTx.hash });

            if (!existingTx) {
                // Determinar beneficiario y categoría basado en memo o datos adicionales
                const { beneficiary, category, purpose } = await this.extractTransactionMetadata(stellarTx, operation);

                // Crear nueva transacción en BD
                const newTransaction = new Transaction({
                    transactionId: `TXN-${stellarTx.hash.substr(0, 8)}`,
                    stellarTxHash: stellarTx.hash,
                    beneficiary: beneficiary || 'Unknown',
                    amount: parseFloat(operation.amount),
                    category: category || 'Economic',
                    purpose: purpose || 'Blockchain Transaction',
                    status: stellarTx.successful ? 'completed' : 'failed',
                    location: 'Stellar Network',
                    blockNumber: ledger.sequence,
                    gasUsed: parseInt(stellarTx.fee_charged),
                    confirmations: await this.calculateConfirmations(ledger.sequence)
                });

                await newTransaction.save();
                console.log('✅ Nueva transacción guardada:', newTransaction.transactionId);

                // Emitir evento en tiempo real
                if (this.io) {
                    this.io.emit('new_transaction', newTransaction);
                }

            } else {
                // Actualizar estado si cambió
                const currentConfirmations = await this.calculateConfirmations(ledger.sequence);
                existingTx.confirmations = currentConfirmations;
                existingTx.status = stellarTx.successful ? 'completed' : 'failed';
                await existingTx.save();
            }

        } catch (error) {
            console.error('❌ Error procesando pago:', error);
        }
    }

    // Procesar operación de contrato
    async processContractOperation(stellarTx, operation, ledger) {
        try {
            console.log('📜 Procesando contrato:', operation.function);

            // Analizar función del contrato
            if (operation.function === 'register_identity') {
                await this.processIdentityRegistration(stellarTx, operation);
            } else if (operation.function === 'create_funding') {
                await this.processFundingCreation(stellarTx, operation, ledger);
            }

        } catch (error) {
            console.error('❌ Error procesando contrato:', error);
        }
    }

    // Extraer metadata de transacción
    async extractTransactionMetadata(stellarTx, operation) {
        let beneficiary = 'Unknown';
        let category = 'Economic';
        let purpose = 'Blockchain Transaction';

        try {
            // Intentar obtener beneficiario por clave pública
            const recipientIdentity = await Identity.findOne({ publicKey: operation.to });
            if (recipientIdentity) {
                beneficiary = recipientIdentity.name || 'Unknown';
            }

            // Analizar memo para metadata adicional
            if (stellarTx.memo) {
                const memo = stellarTx.memo;
                
                if (memo.includes('education')) category = 'Education';
                else if (memo.includes('health')) category = 'Healthcare';
                else if (memo.includes('housing')) category = 'Housing';
                
                // Extraer propósito del memo
                const purposeMatch = memo.match(/purpose:([^|]+)/);
                if (purposeMatch) {
                    purpose = purposeMatch[1].trim();
                }
            }

        } catch (error) {
            console.error('❌ Error extrayendo metadata:', error);
        }

        return { beneficiary, category, purpose };
    }

    // Calcular confirmaciones
    async calculateConfirmations(transactionLedger) {
        try {
            if (!this.lastProcessedLedger) return 0;
            return Math.max(0, this.lastProcessedLedger - transactionLedger);
        } catch (error) {
            return 0;
        }
    }

    // Monitorear cuentas específicas de TrustFundChain
    monitorTrustFundAccounts() {
        const masterKeypair = stellarConfig.getMasterKeypair();
        if (!masterKeypair) return;

        console.log('👥 Monitoreando cuenta maestra:', masterKeypair.publicKey());

        const accountStream = this.server
            .accounts()
            .accountId(masterKeypair.publicKey())
            .stream({
                onmessage: (account) => {
                    console.log('👤 Cambio en cuenta maestra detectado');
                    this.processAccountChange(account);
                },
                onerror: (error) => {
                    console.error('❌ Error en stream de cuenta:', error);
                }
            });

        return accountStream;
    }

    // Procesar cambio en cuenta
    async processAccountChange(account) {
        try {
            console.log('🔄 Procesando cambio de cuenta:', account.id);
            
            // Emitir actualización de balance
            if (this.io) {
                this.io.emit('account_update', {
                    publicKey: account.id,
                    balances: account.balances,
                    sequence: account.sequence
                });
            }

        } catch (error) {
            console.error('❌ Error procesando cambio de cuenta:', error);
        }
    }

    // Sincronizar transacciones existentes
    async syncExistingTransactions() {
        try {
            console.log('🔄 Sincronizando transacciones existentes...');

            const identities = await Identity.find({}, 'publicKey name');
            
            for (const identity of identities) {
                await this.syncAccountTransactions(identity.publicKey, identity.name);
            }

            console.log('✅ Sincronización completada');

        } catch (error) {
            console.error('❌ Error sincronizando transacciones:', error);
        }
    }

    // Sincronizar transacciones de una cuenta
    async syncAccountTransactions(publicKey, accountName) {
        try {
            const stellarTransactions = await stellarService.getAccountTransactions(publicKey, 20);

            for (const stellarTx of stellarTransactions) {
                // Verificar si ya existe
                const existingTx = await Transaction.findOne({ stellarTxHash: stellarTx.hash });
                
                if (!existingTx && stellarTx.transaction_successful) {
                    const newTransaction = new Transaction({
                        transactionId: `TXN-${stellarTx.hash.substr(0, 8)}`,
                        stellarTxHash: stellarTx.hash,
                        beneficiary: accountName || 'Unknown',
                        amount: parseFloat(stellarTx.amount),
                        category: 'Economic',
                        purpose: 'Synchronized Transaction',
                        status: 'completed',
                        location: 'Stellar Network',
                        blockNumber: stellarTx.ledger,
                        gasUsed: parseInt(stellarTx.fee_charged || 100),
                        confirmations: 12,
                        createdAt: new Date(stellarTx.created_at)
                    });

                    await newTransaction.save();
                    console.log('📥 Transacción sincronizada:', newTransaction.transactionId);
                }
            }

        } catch (error) {
            console.error(`❌ Error sincronizando cuenta ${publicKey}:`, error);
        }
    }

    // Verificar estado de transacción en blockchain
    async verifyTransactionStatus(txHash) {
        try {
            const verification = await stellarService.verifyTransaction(txHash);
            
            if (verification.exists) {
                // Actualizar en base de datos
                await Transaction.updateOne(
                    { stellarTxHash: txHash },
                    {
                        status: verification.successful ? 'completed' : 'failed',
                        confirmations: await this.calculateConfirmations(verification.ledger)
                    }
                );

                return {
                    verified: true,
                    successful: verification.successful,
                    ledger: verification.ledger,
                    confirmations: await this.calculateConfirmations(verification.ledger)
                };
            }

            return { verified: false };

        } catch (error) {
            console.error('❌ Error verificando transacción:', error);
            return { verified: false, error: error.message };
        }
    }

    // Obtener estadísticas de blockchain en tiempo real
    async getBlockchainStats() {
        try {
            const masterKeypair = stellarConfig.getMasterKeypair();
            let masterBalance = 0;

            if (masterKeypair) {
                const accountInfo = await stellarService.getAccountInfo(masterKeypair.publicKey());
                masterBalance = parseFloat(accountInfo.balances[0]?.balance || 0);
            }

            const totalIdentities = await Identity.countDocuments();
            const totalTransactions = await Transaction.countDocuments();
            const totalFunding = await Transaction.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            return {
                masterBalance,
                totalIdentities,
                totalTransactions,
                totalFunding: totalFunding[0]?.total || 0,
                network: process.env.STELLAR_NETWORK,
                lastSync: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error);
            return {
                error: error.message
            };
        }
    }

    // Crear transacción de funding real
    async createRealFundingTransaction(beneficiaryPublicKey, amount, category, purpose) {
        try {
            console.log('💰 Creando transacción de funding real:', {
                beneficiaryPublicKey,
                amount,
                category,
                purpose
            });

            const masterKeypair = stellarConfig.getMasterKeypair();
            if (!masterKeypair) {
                throw new Error('Cuenta maestra no configurada');
            }

            // Crear memo con metadata
            const memo = `TrustFund|category:${category}|purpose:${purpose}`;

            // Enviar pago real
            const result = await stellarService.sendPayment(
                masterKeypair.secret(),
                beneficiaryPublicKey,
                amount,
                memo
            );

            // El monitoreo automático detectará y guardará esta transacción
            console.log('✅ Transacción de funding creada:', result.hash);

            return result;

        } catch (error) {
            console.error('❌ Error creando funding real:', error);
            throw error;
        }
    }

    // Detener monitoreo
    stopMonitoring() {
        this.isMonitoring = false;
        console.log('🛑 Monitoreo de blockchain detenido');
    }

    // Obtener información de red
    async getNetworkInfo() {
        try {
            const latestLedger = await this.server.ledgers().order('desc').limit(1).call();
            
            return {
                network: process.env.STELLAR_NETWORK,
                latestLedger: latestLedger.records[0].sequence,
                lastProcessed: this.lastProcessedLedger,
                isMonitoring: this.isMonitoring,
                horizon: process.env.STELLAR_HORIZON_URL
            };

        } catch (error) {
            return {
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainService();
